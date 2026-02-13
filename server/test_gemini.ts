import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const models = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro'];

async function test() {
    console.log('Testing models with API Key:', apiKey ? 'Present' : 'Missing');
    for (const modelName of models) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello');
            const response = await result.response;
            console.log('SUCCESS');
            console.log(response.text());
            return; // Exit after finding a working one
        } catch (error) {
            console.log('FAILED');
            console.log('Error:', error.message);
        }
    }
}

test();
