require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
  },
  {
    timestamps: true,
  },
);

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: String,
    days: Number,
    budgetType: String,
    interests: [String],
    itinerary: mongoose.Schema.Types.Mixed,
    budgetEstimate: mongoose.Schema.Types.Mixed,
    hotels: [String],
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
const Trip = mongoose.model("Trip", tripSchema);

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created",
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/api/dashboard", auth, async (req, res) => {
  try {
    const trips = await Trip.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/trips/generate", auth, async (req, res) => {
  try {
    const { destination, days, budgetType, interests } = req.body;

    let aiData;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `
Generate a JSON response only.

Destination: ${destination}
Days: ${days}
Budget: ${budgetType}
Interests: ${interests.join(", ")}

Return JSON:
{
  "itinerary": [],
  "budgetEstimate": {},
  "hotels": []
}
`;

      const result = await model.generateContent(prompt);

      const text = result.response.text();

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      aiData = JSON.parse(cleaned);
    } catch (error) {
      console.log("Gemini unavailable, using fallback");

      aiData = {
        itinerary: Array.from({ length: Number(days) }, (_, index) => ({
          day: index + 1,
          activities: [
            `Explore ${destination}`,
            "Local sightseeing",
            "Food experience",
            "Popular attractions",
          ],
        })),
        budgetEstimate: {
          flights:
            budgetType === "Low"
              ? "$300"
              : budgetType === "Medium"
                ? "$600"
                : "$1200",
          accommodation:
            budgetType === "Low"
              ? "$200"
              : budgetType === "Medium"
                ? "$500"
                : "$1200",
          food:
            budgetType === "Low"
              ? "$100"
              : budgetType === "Medium"
                ? "$250"
                : "$500",
          activities:
            budgetType === "Low"
              ? "$100"
              : budgetType === "Medium"
                ? "$300"
                : "$700",
          total:
            budgetType === "Low"
              ? "$700"
              : budgetType === "Medium"
                ? "$1650"
                : "$3600",
        },
        hotels: [
          `${destination} Budget Inn`,
          `${destination} City Hotel`,
          `${destination} Grand Resort`,
        ],
      };
    }

    const trip = await Trip.create({
      userId: req.user.id,
      destination,
      days,
      budgetType,
      interests,
      itinerary: aiData.itinerary,
      budgetEstimate: aiData.budgetEstimate,
      hotels: aiData.hotels,
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/api/trips/:id", auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.put("/api/trips/:id", auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(trip._id, req.body, {
      new: true,
    });

    res.json(updatedTrip);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/trips/:id/regenerate-day", auth, async (req, res) => {
  try {
    const { day, instruction } = req.body;

    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
Destination: ${trip.destination}

Regenerate day ${day}

Instruction:
${instruction}

Return JSON only

{
  "day": ${day},
  "activities": []
}
`;

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const regeneratedDay = JSON.parse(cleaned);

    trip.itinerary = trip.itinerary.map((item) =>
      item.day === day ? regeneratedDay : item,
    );

    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.delete("/api/trips/:id", auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    await Trip.findByIdAndDelete(trip._id);

    res.json({
      message: "Trip deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.listen(5050, () => {
  console.log("Server running on port 5050");
});
