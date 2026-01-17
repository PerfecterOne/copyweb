/**
 * Prompt Builder - Modular prompt generation system
 * Dynamically combines prompts based on input type and output format
 */

import promptsConfig from './prompts.json';

export type InputType = 'image' | 'website' | 'figma' | 'prompt';
export type OutputFormat = 'html-css' | 'react' | 'prototype';

interface BuildPromptOptions {
  inputType: InputType;
  outputFormat: OutputFormat;
  userContent: string;
  customInstructions?: string;
}

interface PromptResult {
  systemPrompt: string;
  userPrompt: string;
  fullPrompt: string;  // Full prompt for debugging display
}

/**
 * Build the system prompt
 */
function buildSystemPrompt(outputFormat: OutputFormat): string {
  const { system, outputFormats, commonConstraints } = promptsConfig;
  const output = outputFormats[outputFormat];
  
  return `${system.role}

Expertise: ${system.expertise.join(', ')}

## Your Task
${output.description}

## Output Format Requirements
${output.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## File Structure
${output.fileStructure.join('\n')}

${output.template}

## General Guidelines
${commonConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
}

/**
 * Build the user prompt
 */
function buildUserPrompt(
  inputType: InputType, 
  userContent: string,
  customInstructions?: string
): string {
  const { inputHandlers } = promptsConfig;
  const handler = inputHandlers[inputType];
  
  let prompt = `${handler.instruction}

## Analysis Focus Points
${handler.focusPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

  if (customInstructions) {
    prompt += `

## Additional Requirements
${customInstructions}`;
  }

  // Add content based on input type
  if (inputType === 'image') {
    prompt += `

[User uploaded image will be displayed here]`;
  } else if (inputType === 'website') {
    prompt += `

Target Website URL: ${userContent}`;
  } else if (inputType === 'figma') {
    prompt += `

Figma Design Link: ${userContent}`;
  } else if (inputType === 'prompt') {
    prompt += `

User Description:
${userContent}`;
  }

  return prompt;
}

/**
 * Build the complete prompt (for debugging display)
 */
export function buildPrompt(options: BuildPromptOptions): PromptResult {
  const { inputType, outputFormat, userContent, customInstructions } = options;
  
  const systemPrompt = buildSystemPrompt(outputFormat);
  const userPrompt = buildUserPrompt(inputType, userContent, customInstructions);
  
  const fullPrompt = `=== SYSTEM PROMPT ===
${systemPrompt}

=== USER PROMPT ===
${userPrompt}`;

  return {
    systemPrompt,
    userPrompt,
    fullPrompt
  };
}

/**
 * Get all input type configurations
 */
export function getInputTypes() {
  return Object.entries(promptsConfig.inputHandlers).map(([id, handler]) => ({
    id: id as InputType,
    instruction: handler.instruction,
    focusPoints: handler.focusPoints
  }));
}

/**
 * Get all output format configurations
 */
export function getOutputFormats() {
  return Object.entries(promptsConfig.outputFormats).map(([id, format]) => ({
    id: id as OutputFormat,
    name: format.name,
    description: format.description,
    fileStructure: format.fileStructure
  }));
}

/**
 * Debug: Print prompt to console
 */
export function debugPrompt(options: BuildPromptOptions): void {
  const result = buildPrompt(options);
  console.log('='.repeat(60));
  console.log('🔍 PROMPT BUILDER DEBUG');
  console.log('='.repeat(60));
  console.log(`Input Type: ${options.inputType}`);
  console.log(`Output Format: ${options.outputFormat}`);
  console.log('-'.repeat(60));
  console.log(result.fullPrompt);
  console.log('='.repeat(60));
}
