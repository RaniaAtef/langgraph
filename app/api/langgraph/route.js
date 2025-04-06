import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentExecutor } from '@langchain/core/agents';
import { RunnableSequence } from '@langchain/core/runnables';
import { createOpenAIFunctionsAgent } from 'langchain/agents';

// Define some useful tools
const tools = [
  new DynamicStructuredTool({
    name: "calculatorr",
    description: "Useful for performing mathematical calculations",
    schema: z.object({
      expression: z.string().describe("The mathematical expression to evaluate"),
    }),
    func: async ({ expression }) => {
      try {
        return eval(expression).toString();
      } catch (error) {
        return "Error: Invalid mathematical expression";
      }
    },
  }),
  new DynamicStructuredTool({
    name: "current_time",
    description: "Get the current time",
    schema: z.object({}),
    func: async () => {
      return new Date().toLocaleTimeString();
    },
  }),
];

export async function POST(req) {
  try {
    const body = await req.json();
    const userMessage = body.message;

    const model = new ChatOpenAI({
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create a simple chat prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant. You have access to tools that can help with calculations and tell the current time. Use them when appropriate."],
      ["human", "{input}"],
    ]);

    // Create the agent
    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt,
    });

    // Create the agent executor
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });

    // Create a runnable sequence
    const chain = RunnableSequence.from([
      {
        input: (i) => i.input,
      },
      agentExecutor,
    ]);

    const result = await chain.invoke({ input: userMessage });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
