// The city list behind the site's sign-up forms (the Pack form in
// components/EmailSignup.tsx and the Day Care Comedy waitlist). Shared so the
// server can check a submitted city against the same list the picker offers.

export const CITIES = [
  { group: "Canada", cities: ["Calgary, AB", "Edmonton, AB", "Halifax, NS", "Hamilton, ON", "Kelowna, BC", "Kitchener-Waterloo, ON", "London, ON", "Montreal, QC", "New Westminster, BC", "Niagara Falls, ON", "Oshawa, ON", "Ottawa, ON", "Regina, SK", "Saint John, NB", "Saskatoon, SK", "Toronto, ON", "Vancouver, BC", "Victoria, BC", "Windsor, ON", "Winnipeg, MB"] },
  { group: "United States", cities: ["Albany, NY", "Albuquerque, NM", "Atlanta, GA", "Austin, TX", "Baltimore, MD", "Birmingham, AL", "Bloomington, IN", "Boston, MA", "Bozeman, MT", "Buffalo, NY", "Burlington, VT", "Burbank, CA", "Charlotte, NC", "Chattanooga, TN", "Chicago, IL", "Cincinnati, OH", "Cleveland, OH", "Colorado Springs, CO", "Columbus, OH", "Dallas, TX", "Dayton, OH", "Denver, CO", "Des Moines, IA", "Detroit, MI", "El Paso, TX", "Fargo, ND", "Fort Lauderdale, FL", "Fort Worth, TX", "Grand Rapids, MI", "Greenville, SC", "Hartford, CT", "Honolulu, HI", "Houston, TX", "Huntsville, AL", "Indianapolis, IN", "Jackson, MS", "Jacksonville, FL", "Kansas City, MO", "Las Vegas, NV", "Lexington, KY", "Long Island, NY", "Los Angeles, CA", "Louisville, KY", "Madison, WI", "Miami, FL", "Milwaukee, WI", "Minneapolis, MN", "Nashville, TN", "New Brunswick, NJ", "New Orleans, LA", "New York, NY", "Newport News, VA", "Oklahoma City, OK", "Omaha, NE", "Orlando, FL", "Peoria, IL", "Philadelphia, PA", "Phoenix, AZ", "Pittsburgh, PA", "Portland, ME", "Portland, OR", "Providence, RI", "Raleigh, NC", "Reno, NV", "Richmond, VA", "Sacramento, CA", "Salt Lake City, UT", "San Antonio, TX", "San Diego, CA", "San Francisco, CA", "San Jose, CA", "Seattle, WA", "Spokane, WA", "St. Louis, MO", "Syracuse, NY", "Tacoma, WA", "Tampa, FL", "Toledo, OH", "Tucson, AZ", "Tulsa, OK", "Virginia Beach, VA", "Washington, DC"] },
  { group: "United Kingdom", cities: ["Birmingham", "Bristol", "Edinburgh", "Glasgow", "Leeds", "Liverpool", "London", "Manchester"] },
  { group: "Australia", cities: ["Adelaide", "Brisbane", "Gold Coast", "Hobart", "Melbourne", "Perth", "Sydney"] },
  { group: "Europe", cities: ["Amsterdam", "Antwerp", "Barcelona", "Berlin", "Brussels", "Budapest", "Cologne", "Copenhagen", "Dublin", "Frankfurt", "Gothenburg", "Hamburg", "Helsinki", "Krakow", "Lisbon", "Madrid", "Munich", "Oslo", "Paris", "Prague", "Rome", "Rotterdam", "Stockholm", "Tallinn", "Vienna", "Warsaw", "Zurich"] },
  { group: "South Africa", cities: ["Cape Town", "Durban", "Johannesburg"] },
];

export const VALID_CITIES = new Set(CITIES.flatMap((g) => g.cities));
