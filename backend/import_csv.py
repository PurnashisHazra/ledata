import csv
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models import Dataset

CSV_PATH = '/Users/tesla/Downloads/Datasets_150lot.csv'
MONGODB_URI = 'mongodb+srv://purnashis:a1s2d3f4g5@cluster0.taegdc1.mongodb.net/'


def convert_field(key: str, value: str):
    """Convert each input field to the correct type for the Dataset model."""
    if value is None:
        return ""

    value = value.strip()
    if value == "":
        return ""

    # Numeric fields
    if any(k in key.lower() for k in ["year", "count", "gb", "episodes", "hours", "size", "frame", "duration", "trajectories", "timesteps", "robots", "demos"]):
        try:
            return int(value) if value.isdigit() else float(value)
        except ValueError:
            return ""

    # Everything else as string
    return value


async def main():
    # Initialize MongoDB connection
    client = AsyncIOMotorClient(MONGODB_URI)
    await init_beanie(database=client.ledata, document_models=[Dataset])

    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        entries = []
        print("🚀 Starting CSV import...", reader)
        for row in reader:
            mapped_data = {}
            for key, value in row.items():
                clean_key = (
                    key.strip()
                    .replace(" ", "_")
                    .replace("-", "_")
                    .replace("(", "")
                    .replace(")", "")
                    .replace("?", "")
                    .replace("/", "_")
                    .replace("#", "")
                    .lower()
                )
                mapped_data[clean_key] = convert_field(key, value)
            print("➡️ Processing row:", mapped_data)
            # Create Dataset instance dynamically
            try:
                entry = Dataset(**mapped_data)
                entries.append(entry)
            except Exception as e:
                print(f"⚠️ Skipping row due to error: {e}")

        # Bulk insert
        if entries:
            await Dataset.insert_many(entries)
            print(f"✅ Successfully inserted {len(entries)} entries into MongoDB.")
        else:
            print("⚠️ No valid entries found in CSV.")


if __name__ == "__main__":
    asyncio.run(main())