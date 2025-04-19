# Weather CLI with OpenAI Tool Calling

A command-line interface application that uses OpenAI's tool calling capabilities to provide weather information.

## Features

- Natural language weather queries
- OpenAI-powered responses
- Current weather data from OpenWeatherMap API
- Easy-to-read colorful output
- Simple input handling with Node.js built-in readline module

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd weather-cli
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the environment variables template and add your API keys:
   ```
   cp .env.example .env
   ```
   
   Then edit the `.env` file to add:
   - Your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Your OpenWeatherMap API key from [OpenWeatherMap](https://openweathermap.org/api)

## Usage

Start the CLI application:

```
npm start
```

Example queries:
- "What's the weather like in Tokyo?"
- "Should I bring an umbrella in London today?"
- "How hot is it in Dubai in Fahrenheit?"
- "What's the temperature in New York City?"

Type "exit" to quit the application.

## How It Works

1. The app takes your weather-related question as input using the readline module
2. It uses OpenAI to understand your query and extract relevant location and unit preferences
3. It fetches real-time weather data from OpenWeatherMap
4. It sends the weather data back to OpenAI for a natural language interpretation
5. It displays both the raw weather data and AI interpretation

## Dependencies

- OpenAI API for natural language processing and tool calling
- OpenWeatherMap API for weather data
- Node.js native modules for CLI functionality
- Chalk for colorful terminal output 