import asyncio
from app.services.gemini_service import analyze_resume_with_ai

async def main():
    resume_text = "I am a software engineer."
    jd = "Company: CompuCom. Role: Engineer."
    try:
        res = await analyze_resume_with_ai(resume_text, jd)
        print("Success:", res)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
