import ts from "typescript";

interface WorkerInfo {
  workerName: string;
  relativeWorkerPath: string;
  sourceTail: string;
  start: number;
  end: number;
}

function analyzeWorkerCall(
  node: ts.NewExpression,
  sourceFile: ts.SourceFile,
): WorkerInfo | null {
  if (!node.expression || !ts.isIdentifier(node.expression)) {
    return null;
  }

  const workerName = node.expression.text;
  if (
    !workerName.includes("Worker") ||
    !node.arguments ||
    node.arguments.length === 0
  ) {
    return null;
  }

  const argumentStart = node.arguments[0]!.getStart();
  const argumentEnd = node.arguments[0]!.getEnd();
  const argumentText = sourceFile.text.substring(argumentStart, argumentEnd);

  const pathMatch = argumentText.match(/['"`](.+?)['"`]/);
  if (!pathMatch || !pathMatch[1]) {
    return null;
  }

  const nodeStart = node.getFullStart();
  const nodeEnd = node.getEnd();

  return {
    workerName,
    relativeWorkerPath: pathMatch[1],
    sourceTail: sourceFile.text.substring(argumentEnd, nodeEnd),
    start: nodeStart,
    end: nodeEnd,
  };
}

export function findWorkers(
  sourcePath: string,
  sourceCode: string,
): WorkerInfo[] {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );
  const workerInfos: WorkerInfo[] = [];

  function visit(node: ts.Node) {
    if (ts.isNewExpression(node)) {
      const workerInfo = analyzeWorkerCall(node, sourceFile);
      if (workerInfo) {
        workerInfos.push(workerInfo);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  return workerInfos;
}
