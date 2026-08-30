/**
 * Static reference data for the seeder. Kept as plain arrays (rather than a
 * faker dependency) so seeding is deterministic, offline, and dependency-free.
 */

export const HOBBIES = [
  'Photography', 'Reading', 'Hiking', 'Cooking', 'Gaming', 'Cycling', 'Running',
  'Painting', 'Gardening', 'Yoga', 'Chess', 'Swimming', 'Traveling', 'Fishing',
  'Woodworking', 'Knitting', 'Pottery', 'Surfing', 'Skiing', 'Climbing',
  'Birdwatching', 'Astronomy', 'Calligraphy', 'Baking', 'Dancing', 'Singing',
  'Guitar', 'Piano', 'Drumming', 'Podcasting', 'Blogging', 'Volunteering',
  'Camping', 'Kayaking', 'Sailing', 'Archery', 'Bowling', 'Golf', 'Tennis',
  'Basketball', 'Football', 'Volleyball', 'Martial Arts', 'Boxing', 'Pilates',
  'Meditation', 'Origami', 'Scrapbooking', 'Coin Collecting', 'Stamp Collecting',
  'Model Building', 'Drone Flying', 'Geocaching', 'Metal Detecting', 'Beekeeping',
  'Home Brewing', 'Wine Tasting', 'Board Games', 'Puzzles', 'Magic Tricks',
  'Juggling', 'Skateboarding', 'Roller Skating', 'Horse Riding', 'Scuba Diving',
  'Snorkeling', 'Paragliding', 'Motorcycling', 'Car Restoration', 'Coding',
] as const;

export const NATIONALITIES = [
  'Azerbaijani', 'American', 'British', 'German', 'French', 'Italian', 'Spanish',
  'Portuguese', 'Dutch', 'Belgian', 'Swiss', 'Austrian', 'Swedish', 'Norwegian',
  'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian', 'Greek',
  'Turkish', 'Ukrainian', 'Georgian', 'Kazakh', 'Indian', 'Pakistani',
  'Bangladeshi', 'Chinese', 'Japanese', 'Korean', 'Vietnamese', 'Thai',
  'Filipino', 'Indonesian', 'Malaysian', 'Australian', 'New Zealander',
  'Canadian', 'Mexican', 'Brazilian', 'Argentinian', 'Chilean', 'Colombian',
  'Peruvian', 'Egyptian', 'Moroccan', 'Nigerian', 'Kenyan', 'South African',
  'Emirati', 'Saudi', 'Israeli', 'Lebanese', 'Jordanian', 'Irish', 'Scottish',
] as const;

export const FIRST_NAMES = [
  'Aiden', 'Alex', 'Alice', 'Amara', 'Amir', 'Ana', 'Andrei', 'Anna', 'Antonio',
  'Arash', 'Aria', 'Arthur', 'Ayaz', 'Beatriz', 'Ben', 'Bianca', 'Bruno',
  'Camila', 'Carlos', 'Caroline', 'Chen', 'Chloe', 'Clara', 'Daniel', 'Daria',
  'David', 'Diego', 'Dmitri', 'Ekaterina', 'Elena', 'Eli', 'Elif', 'Emily',
  'Emma', 'Enzo', 'Erik', 'Esther', 'Fatima', 'Felix', 'Fiona', 'Gabriel',
  'George', 'Grace', 'Hannah', 'Hassan', 'Helena', 'Henry', 'Hiroshi', 'Hugo',
  'Ibrahim', 'Ingrid', 'Isabel', 'Ivan', 'Jack', 'Jakub', 'James', 'Jasmine',
  'Javier', 'Jonas', 'Julia', 'Kai', 'Karim', 'Katarina', 'Kenji', 'Klara',
  'Lars', 'Laura', 'Leila', 'Leo', 'Liam', 'Lin', 'Lucas', 'Lucia', 'Luka',
  'Mads', 'Maja', 'Marco', 'Maria', 'Mateo', 'Matteo', 'Maya', 'Mehmet', 'Mia',
  'Mikael', 'Mila', 'Mohammed', 'Nadia', 'Nathan', 'Nikola', 'Nina', 'Noah',
  'Nur', 'Olga', 'Oliver', 'Omar', 'Oscar', 'Paulo', 'Pedro', 'Petra', 'Priya',
  'Rafael', 'Rania', 'Raul', 'Rebecca', 'Ruben', 'Ruslan', 'Sabine', 'Samir',
  'Sara', 'Sebastian', 'Selin', 'Sofia', 'Stefan', 'Sven', 'Tara', 'Theo',
  'Thomas', 'Tomas', 'Valeria', 'Victor', 'Viktoria', 'Wei', 'Yara', 'Yusuf',
  'Zara', 'Zeynep',
] as const;

export const LAST_NAMES = [
  'Abbas', 'Adams', 'Ahmadi', 'Aliyev', 'Almeida', 'Andersen', 'Anderson',
  'Bailey', 'Baker', 'Barnes', 'Becker', 'Bennett', 'Bergmann', 'Bianchi',
  'Blanc', 'Brooks', 'Brown', 'Bruno', 'Campbell', 'Carter', 'Castillo',
  'Chen', 'Clark', 'Cohen', 'Collins', 'Costa', 'Cruz', 'Dahl', 'Davies',
  'Delgado', 'Diaz', 'Dubois', 'Duarte', 'Edwards', 'Eriksen', 'Esposito',
  'Evans', 'Fernandez', 'Fischer', 'Fletcher', 'Foster', 'Garcia', 'Gomez',
  'Gonzalez', 'Green', 'Gruber', 'Gupta', 'Hall', 'Hansen', 'Harris', 'Hayes',
  'Hoffmann', 'Holm', 'Hughes', 'Ibrahim', 'Ivanov', 'Jackson', 'Jansen',
  'Jensen', 'Johnson', 'Jones', 'Kaya', 'Keller', 'Khan', 'Kim', 'King',
  'Kowalski', 'Kumar', 'Larsen', 'Laurent', 'Lee', 'Lefebvre', 'Lewis', 'Li',
  'Lindqvist', 'Lopez', 'Marino', 'Martin', 'Martinez', 'Mehta', 'Mendes',
  'Meyer', 'Mitchell', 'Moreau', 'Morgan', 'Moretti', 'Morris', 'Murphy',
  'Nakamura', 'Navarro', 'Nguyen', 'Nielsen', 'Novak', 'Nowak', 'Okafor',
  "O'Brien", 'Oliveira', 'Ortiz', 'Osei', 'Parker', 'Patel', 'Pereira',
  'Petrov', 'Phillips', 'Popescu', 'Ramirez', 'Reed', 'Reyes', 'Ricci',
  'Roberts', 'Rodriguez', 'Rossi', 'Ruiz', 'Russo', 'Sanchez', 'Santos',
  'Sato', 'Schmidt', 'Schneider', 'Scott', 'Sharma', 'Silva', 'Simmons',
  'Singh', 'Smith', 'Sokolov', 'Sultanov', 'Suzuki', 'Tanaka', 'Taylor',
  'Torres', 'Turner', 'Vargas', 'Vasquez', 'Wagner', 'Walker', 'Wang', 'Ward',
  'Watson', 'Weber', 'White', 'Williams', 'Wilson', 'Wood', 'Wright', 'Yamada',
  'Yilmaz', 'Young', 'Zhang', 'Zimmermann',
] as const;
