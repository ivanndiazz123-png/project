// Simulates Java compilation and execution

export async function compileJava(code, filename) {
  const startTime = Date.now();

  try {
    const validation = validateJavaSyntax(code);
    if (!validation.valid) {
      return {
        success: false,
        output: `Compilation Error:\n${validation.error}`,
        error: validation.error,
        compileTime: Date.now() - startTime
      };
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : filename.replace('.java', '');

    const executionResult = simulateExecution(code, className);

    return {
      success: executionResult.success,
      output: executionResult.output,
      error: executionResult.error || null,
      compileTime: Date.now() - startTime,
      className
    };

  } catch (error) {
    return {
      success: false,
      output: `System Error: ${error.message}`,
      error: error.message,
      compileTime: Date.now() - startTime
    };
  }
}

function validateJavaSyntax(code) {
  const checks = [
    { test: /class\s+\d/, error: 'Class name cannot start with a number' },
    { test: /public\s+class\s+\w+.*public\s+class\s+\w+/, error: 'Multiple public classes found' },
    { test: /\{\s*\}/, error: 'Empty class body' },
  ];

  for (const check of checks) {
    if (check.test.test(code)) {
      return { valid: false, error: check.error };
    }
  }

  let braceCount = 0;
  for (const char of code) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) {
      return { valid: false, error: 'Unmatched closing brace' };
    }
  }

  if (braceCount !== 0) {
    return { valid: false, error: 'Unmatched opening brace' };
  }

  return { valid: true };
}

function simulateExecution(code, className) {
  const mainMatch = code.match(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);

  if (!mainMatch) {
    return {
      success: true,
      output: `Compilation successful.\nNo main method found in class ${className}.\nClass ${className} compiled successfully.`,
    };
  }

  const mainBody = mainMatch[1];
  let output = '';
  const printedValues = [];

  const printlnMatches = mainBody.matchAll(/System\.out\.println\s*\(([^)]+)\)/g);
  for (const match of printlnMatches) {
    const content = match[1].trim();

    if (content.startsWith('"') && content.endsWith('"')) {
      printedValues.push(content.slice(1, -1));
    } else if (/^\w+$/.test(content)) {
      printedValues.push(`[${content}]`);
    } else {
      printedValues.push(`[${content}]`);
    }
  }

  const scannerMatches = mainBody.matchAll(/new\s+Scanner\s*\(\s*System\.in\s*\)/g);
  const hasScanner = [...scannerMatches].length > 0;

  output = `Compiling ${className}.java...\n`;
  output += `Compilation successful.\n\n`;
  output += `Running ${className}...\n`;
  output += `----------------------------------------\n`;

  if (printedValues.length > 0) {
    output += printedValues.join('\n') + '\n';
  }

  if (hasScanner) {
    output += `\n[Program waiting for input...]\n`;
  }

  output += `----------------------------------------\n`;
  output += `Process finished with exit code 0\n`;
  output += `Execution time: ${(Math.random() * 100 + 50).toFixed(2)}ms`;

  return {
    success: true,
    output
  };
}
