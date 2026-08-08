import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceFiles = {
  routes: resolve(projectRoot, "src/router/routes.ts"),
  app: resolve(projectRoot, "src/App.tsx"),
  presenter: resolve(projectRoot, "src/core/Presenter.tsx"),
  modal: resolve(projectRoot, "src/core/Modal.tsx"),
};
const outputPath = resolve(
  projectRoot,
  "src/agent/generated/behaviorManifest.ts",
);

const sources = Object.fromEntries(
  await Promise.all(
    Object.entries(sourceFiles).map(async ([name, path]) => [
      name,
      await readFile(path, "utf8"),
    ]),
  ),
);

const routeSourceFile = ts.createSourceFile(
  sourceFiles.routes,
  sources.routes,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

function unwrap(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression?.(current)
  ) {
    current = current.expression;
  }
  return current;
}

function findVariableInitializer(name) {
  let initializer = null;
  routeSourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        declaration.initializer
      ) {
        initializer = unwrap(declaration.initializer);
      }
    }
  });
  if (!initializer) throw new Error(`Unable to find ${name}`);
  return initializer;
}

function readStringProperty(object, propertyName) {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ((ts.isIdentifier(candidate.name) &&
        candidate.name.text === propertyName) ||
        (ts.isStringLiteral(candidate.name) &&
          candidate.name.text === propertyName)),
  );
  if (!property || !ts.isPropertyAssignment(property)) return null;
  const value = unwrap(property.initializer);
  return ts.isStringLiteralLike(value) ? value.text : null;
}

function readRouteSchemas() {
  const initializer = findVariableInitializer("ROUTES");
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error("ROUTES must be an array literal");
  }

  return initializer.elements.flatMap((element) => {
    const value = unwrap(element);
    if (!ts.isObjectLiteralExpression(value)) return [];
    const id = readStringProperty(value, "id");
    const pattern = readStringProperty(value, "pattern");
    const eyebrow = readStringProperty(value, "eyebrow");
    return id && pattern && eyebrow ? [{ id, pattern, eyebrow }] : [];
  });
}

function readDemoTree() {
  const initializer = findVariableInitializer("DEMO_ROUTE_TREE");
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error("DEMO_ROUTE_TREE must be an array literal");
  }
  const nodes = [];
  const visitArray = (array, parentPath = null) => {
    for (const element of array.elements) {
      const value = unwrap(element);
      if (!ts.isObjectLiteralExpression(value)) continue;
      const path = readStringProperty(value, "path");
      if (!path) continue;
      nodes.push({ path, parentPath });
      const children = value.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) &&
          ((ts.isIdentifier(property.name) && property.name.text === "children") ||
            (ts.isStringLiteral(property.name) && property.name.text === "children")),
      );
      if (children && ts.isPropertyAssignment(children)) {
        const childrenValue = unwrap(children.initializer);
        if (ts.isArrayLiteralExpression(childrenValue)) {
          visitArray(childrenValue, path);
        }
      }
    }
  };
  visitArray(initializer);
  return nodes;
}

function matchPattern(pattern, path) {
  const names = [];
  const source = pattern
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment.startsWith(":")) {
        names.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  const match = path.match(new RegExp(`^${source}$`));
  if (!match) return null;
  return Object.fromEntries(
    names.map((name, index) => [name, decodeURIComponent(match[index + 1])]),
  );
}

const routeSchemas = readRouteSchemas();
const demoTree = readDemoTree();
const routeInstances = demoTree.map(({ path, parentPath }) => {
  const schema = routeSchemas.find((route) => matchPattern(route.pattern, path));
  if (!schema) throw new Error(`No route schema matches ${path}`);
  return {
    id: `${schema.id}:${path}`,
    routeId: schema.id,
    path,
    pattern: schema.pattern,
    params: matchPattern(schema.pattern, path),
    parentPath,
    childPaths: demoTree
      .filter((candidate) => candidate.parentPath === path)
      .map((candidate) => candidate.path),
  };
});

const actionCandidates = [
  {
    id: "navigate",
    label: "导航到代码声明的路由",
    evidence: "navigate() + History API",
    enabled: /const navigate = useCallback/.test(sources.app),
  },
  {
    id: "back",
    label: "返回父级或关闭顶层界面",
    evidence: "navigateToParent()",
    enabled: /const navigateToParent = useCallback/.test(sources.app),
  },
  {
    id: "push-presenter",
    label: "派生同 URL Presenter",
    evidence: "pushPresenter()",
    enabled: /const pushPresenter = useCallback/.test(sources.app),
  },
  {
    id: "open-modal",
    label: "派生 Modal",
    evidence: "openModal()",
    enabled: /const openModal = useCallback/.test(sources.app),
  },
  {
    id: "inspect-stack",
    label: "切换堆叠或网格检查模式",
    evidence: "cycleInspectionMode()",
    enabled: /const cycleInspectionMode = useCallback/.test(sources.app),
  },
  {
    id: "restore-query",
    label: "返回时恢复页面查询条件",
    evidence: "queryStringCacheMap",
    enabled:
      /queryStringCacheMap/.test(sources.app) &&
      /setQueryStringCache/.test(sources.presenter),
  },
].filter((action) => action.enabled);

const sourceHash = createHash("sha256")
  .update(Object.values(sources).join("\n---SOURCE---\n"))
  .digest("hex")
  .slice(0, 12);

const manifest = {
  schemaVersion: 1,
  sourceHash,
  generatedFrom: [
    "src/router/routes.ts",
    "src/App.tsx",
    "src/core/Presenter.tsx",
    "src/core/Modal.tsx",
  ],
  analysisMode: "route-ast+source-feature-scan",
  routeSchemas,
  routeInstances,
  surfaces: [
    {
      id: "route-presenter",
      label: "路由 Presenter",
      evidence: "buildRouteStack()",
    },
    {
      id: "pushed-presenter",
      label: "同 URL Presenter",
      evidence: "createPresenterRecord()",
    },
    {
      id: "modal",
      label: "Modal",
      evidence: "createModalRecord()",
    },
  ],
  actions: actionCandidates.map(({ id, label, evidence }) => ({ id, label, evidence })),
};

const output = `// Generated by scripts/generate-agent-manifest.mjs. Do not edit by hand.\n` +
  `export const behaviorManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;

await writeFile(outputPath, output, "utf8");
console.log(
  `Generated ${routeInstances.length} route nodes and ${manifest.actions.length} actions (${sourceHash}).`,
);
