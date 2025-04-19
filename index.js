#!/usr/bin/env node
import { config } from 'dotenv';
import OpenAI from 'openai';
import chalk from 'chalk';
import readline from 'readline';

// Load environment variables
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.VITE_OPENAI_BASE_URL,
  defaultQuery: {
    "api-version": "2025-01-01-preview",
  },
  defaultHeaders: {
    "api-key": process.env.VITE_OPENAI_API_KEY,
  },
});

// Define the weather API tool
const weatherTools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA or Paris, France'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The unit of temperature to return'
          }
        },
        required: ['location']
      }
    }
  }
];

// Function to handle getting weather data
async function getWeather(location, unit = 'celsius') {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('WEATHER_API_KEY is not set in .env file');
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${unit === 'celsius' ? 'metric' : 'imperial'}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: `${data.main.temp}°${unit === 'celsius' ? 'C' : 'F'}`,
      description: data.weather[0].description,
      feels_like: `${data.main.feels_like}°${unit === 'celsius' ? 'C' : 'F'}`,
      humidity: `${data.main.humidity}%`,
      wind_speed: `${data.wind.speed} ${unit === 'celsius' ? 'm/s' : 'mph'}`
    };
  } catch (error) {
    console.error(chalk.red(`Error fetching weather data: ${error.message}`));
    return { error: error.message };
  }
}

// Function to process user input with OpenAI
async function processUserInput(input) {
  console.log(chalk.blue('Thinking...'));
  
  try {
    const response = await openai.chat.completions.create({
      model: 'Proton',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. You can use the get_weather function to provide accurate weather information.'
        },
        { role: 'user', content: input }
      ],
      tools: weatherTools,
      tool_choice: 'auto'
    });
    
    const message = response.choices[0].message;
    console.log({message})
    // Check if the model wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      
      if (toolCall.function.name === 'get_weather') {
        const args = JSON.parse(toolCall.function.arguments);
        const { location, unit = 'celsius' } = args;
        
        console.log(chalk.blue(`Fetching weather for ${location}...`));
        
        const weatherData = await getWeather(location, unit);
        
        if (weatherData.error) {
          console.log(chalk.red(`Error: ${weatherData.error}`));
          return;
        }
        console.log({weatherData,toolCall})
        // Send the function result back to OpenAI to get a natural language response
        const secondResponse = await openai.chat.completions.create({
          model: 'Proton',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful weather assistant. Provide weather information in a friendly, concise way.'
            },
            { role: 'user', content: input },
            message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(weatherData)
            }
          ],
        });
        
        console.log(chalk.green('\n🌤️  Weather Information:'));
        console.log(chalk.cyan(`📍 Location: ${weatherData.location}`));
        console.log(chalk.yellow(`🌡️  Temperature: ${weatherData.temperature}`));
        console.log(chalk.blue(`🤔 Feels like: ${weatherData.feels_like}`));
        console.log(chalk.magenta(`💧 Humidity: ${weatherData.humidity}`));
        console.log(chalk.white(`💨 Wind: ${weatherData.wind_speed}`));
        console.log(chalk.gray(`🔍 Description: ${weatherData.description}\n`));
        
        console.log(chalk.green('AI Interpretation:'));
        console.log(secondResponse.choices[0].message.content);
      }
    } else {
      // If no function call was made, just display the assistant's response
      console.log(chalk.green('\nAssistant:'));
      console.log(message.content);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function to run the CLI
async function main() {
  console.log(chalk.bold.green('\n🌦️  Weather CLI Assistant 🌦️\n'));
  console.log(chalk.blue('Ask about the weather anywhere! Try:'));
  console.log(chalk.gray('- "What\'s the weather like in Tokyo?"'));
  console.log(chalk.gray('- "Should I bring an umbrella in London today?"'));
  console.log(chalk.gray('- "How hot is it in Dubai in Fahrenheit?"\n'));
  
  // Function to ask for user input
  function askQuestion() {
    rl.question('Ask about weather (or type "exit" to quit): ', async (query) => {
      if (query.toLowerCase() === 'exit') {
        console.log(chalk.yellow('\nGoodbye! 👋\n'));
        rl.close();
        return;
      }
      
      await processUserInput(query);
      askQuestion(); // Ask again after processing
    });
  }
  
  askQuestion(); // Start the questioning loop
}

main().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
}); 