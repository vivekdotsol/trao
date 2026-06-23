export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Activity {
  time?: string;
  activity: string;
  description?: string;
  cost?: string;
}

export interface DayItinerary {
  day: number;
  activities: Activity[];
}

export interface BudgetEstimate {
  flights: string;
  accommodation: string;
  food: string;
  activities: string;
  total: string;
}

export interface Trip {
  _id: string;
  userId: string;
  destination: string;
  days: number;
  budgetType: string;
  interests: string[];
  itinerary: DayItinerary[];
  budgetEstimate: BudgetEstimate;
  hotels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
