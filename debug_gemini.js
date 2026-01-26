const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    const genAI = new GoogleGenerativeAI("AIzaSyCAUR9H2eJpJxZos6NQMt-sJbJklDtt1M8");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("hi");
        const response = await result.response;
        console.log("Success:", response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
