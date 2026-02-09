
import * as babel from '@babel/core';
import * as t from '@babel/types';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

// Note: In a real environment we might import these differently depending on ESM/CJS
// For this standalone script we assume we're running in a context where these are available.

export function compile(code: string): string {
    const result = babel.transformSync(code, {
        presets: [],
        plugins: [velocityJsxPlugin],
        babelrc: false,
        configFile: false,
    });
    return result?.code || '';
}

function velocityJsxPlugin({ types: t }: any) {
    return {
        visitor: {
            JSXElement(path: any) {
                // 1. Analyze the JSX Element
                const { html, expressions } = analyzeJSX(path.node);

                // 2. Create the template creation statement (hoisted)
                // const _tmpl$ = createTemplate("html");
                const templateId = path.scope.generateUidIdentifier('tmpl$');
                const templateStr = t.stringLiteral(html);
                const createTemplateCall = t.callExpression(
                    t.identifier('createTemplate'),
                    [templateStr]
                );

                const program = path.findParent((p: any) => p.isProgram());
                program.pushContainer('body',
                    t.variableDeclaration('const', [
                        t.variableDeclarator(templateId, createTemplateCall)
                    ])
                );

                // 3. Create the clone call
                // _tmpl$.cloneNode(true)
                const cloneCall = t.callExpression(
                    t.memberExpression(templateId, t.identifier('cloneNode')),
                    [t.booleanLiteral(true)]
                );

                // 4. Handle dynamic expressions (simplified for Phase 9)
                // For now, we return the clone call.
                // Full implementation would wrap this in a block to attach effects.
                // e.g. (() => { const _el$ = ...; insert(...); return _el$; })()

                if (expressions.length > 0) {
                    // Complex case with dynamics
                    // Replace with IIFE or block
                    const elId = path.scope.generateUidIdentifier('el$');
                    const statements = [
                        t.variableDeclaration('const', [
                            t.variableDeclarator(elId, cloneCall)
                        ]),
                        ...expressions.map((expr: any, i: number) => {
                            // This is a simplification.
                            // We need to traverse the DOM to find the insertion point.
                            // For this POC, we assume simple appending or just generating code comments
                            return t.expressionStatement(
                                t.callExpression(t.identifier('insert'), [elId, expr])
                            );
                        }),
                        t.returnStatement(elId)
                    ];

                    path.replaceWith(t.callExpression(
                        t.arrowFunctionExpression([], t.blockStatement(statements)),
                        []
                    ));
                } else {
                    // Simple static case
                    path.replaceWith(cloneCall);
                }
            }
        }
    };
}

function analyzeJSX(node: any): { html: string, expressions: any[] } {
    let html = '';
    const expressions: any[] = [];

    if (t.isJSXElement(node)) {
        const tag = (node.openingElement.name as any).name;
        html += `<${tag}`;

        // Attributes
        node.openingElement.attributes.forEach((attr: any) => {
            if (t.isJSXAttribute(attr)) {
                if (t.isStringLiteral(attr.value)) {
                    html += ` ${attr.name.name}="${attr.value.value}"`;
                } else if (t.isJSXExpressionContainer(attr.value)) {
                    // Dynamic attribute
                    // html += ` ${attr.name.name}><!--#-->`; // Marker? No, attributes are different.
                    // For now, ignroe dynamic attrs in HTML string
                    expressions.push(attr.value.expression);
                }
            }
        });

        html += '>';

        // Children
        node.children.forEach((child: any) => {
            if (t.isJSXText(child)) {
                html += child.value;
            } else if (t.isJSXElement(child)) {
                const res = analyzeJSX(child);
                html += res.html;
                expressions.push(...res.expressions);
            } else if (t.isJSXExpressionContainer(child)) {
                html += '<!--#-->'; // Marker
                expressions.push(child.expression);
            }
        });

        html += `</${tag}>`;
    }

    return { html, expressions };
}
