import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const timeTool = new DynamicStructuredTool({
  name: "current_time",
  description: "Get the current time",
  schema: z.object({}),
  func: async () => {
    return new Date().toLocaleTimeString();
  },
});

async function testTimeTool() {
  const result = await timeTool.invoke({});
  console.log("Current time:", result);
}

testTimeTool(); 