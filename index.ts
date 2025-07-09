var fileName = "main.org";

fileName = process.argv[2] || fileName;

const ReservedKeywords = [
    "var",
    "mod",
    "realloc",
    "if",
    "else",
    "while",
    "call",
    "syscall",
    "function",
    "return",
    "free",
    "do",
    "alloc",
    "break",
    "continue",
    "get",
    "set"
];

type TokenType = {
    type: string;
    value: string;
};

type ValueTypes = {
    size: ExpressionType;
    baseType:
        | "int8"
        | "int16"
        | "int32"
        | "int64"
        | "uint8"
        | "uint16"
        | "uint32"
        | "uint64"
        | "float"
        | "double"
        | "char"
        | "pointer";
};
var validBaseTypes = [
    "int8",
    "int16",
    "int32",
    "int64",
    "uint8",
    "uint16",
    "uint32",
    "uint64",
    "float",
    "double",
    "char",
    "pointer",
];

type AllocationForPointerType = {
    type: ValueTypes;
};

type GetPointerValueType = {
    address: ExpressionType;
};

type FreeMemoryType = {
    address: ExpressionType;
};

type ModifyPointerValueType = {
    address: ExpressionType;
    newValue: ExpressionType;
};

type VariableDeclarationType = {
    type: ValueTypes;
    name: string;
    expression: ExpressionType;
};

type ModifyVariableType = {
    variable: VariableDeclarationType;
    newExpression: ExpressionType;
};

type ReallocVariableType = {
    variable: VariableDeclarationType;
    newType: ValueTypes;
};

type IfType = {
    condition: ExpressionType;
    body: ExpressionType;
};

type ElseIfType = {
    condition: ExpressionType;
    body: ExpressionType;
};

type ElseType = {
    body: ExpressionType;
};

type IfElseChainType = {
    if: IfType;
    elseIfs: ElseIfType[] | null;
    else: ElseType | null;
};

type WhileType = {
    condition: ExpressionType;
    body: ExpressionType;
};

type BreakType = null;
type ContinueType = null;

type SystemCallType = {
    functionName: string;
    parameters: ExpressionType;
};

type FunctionParameterType = {
    type: ValueTypes;
    name: string;
};

type FunctionDeclarationType = {
    name: string;
    returnType: ValueTypes;
    parameters: FunctionParameterType[];
    body: ExpressionType;
};

type FunctionCallType = {
    function: FunctionDeclarationType;
    parameters: FunctionParameterType[];
};

type MathExpressionType = {
    left: ExpressionType;
    operator: "+" | "-" | "*" | "/" | "%" | "^";
    right: ExpressionType;
};

type ReturnType = ExpressionType;

type VariableType = {
    name: string;
    location: ExpressionType;
};

type SingleExpressionType = {
    type:
        | "variableDeclaration"
        | "modifyVariable"
        | "reallocVariable"
        | "ifElseChain"
        | "whileLoop"
        | "systemCall"
        | "functionCall"
        | "functionDeclaration"
        | "mathExpression"
        | "return"
        | "number"
        | "string"
        | "variable"
        | "freeMemory"
        | "allocationForPointer"
        | "modifyPointerValue"
        | "getPointerValue"
        | "break"
        | "continue";   
    expression:
        | VariableDeclarationType
        | ModifyVariableType
        | ReallocVariableType
        | IfElseChainType
        | WhileType
        | SystemCallType
        | FunctionCallType
        | FunctionDeclarationType
        | MathExpressionType
        | ReturnType
        | number
        | string
        | VariableType
        | FreeMemoryType
        | AllocationForPointerType
        | ModifyPointerValueType
        | GetPointerValueType 
        | BreakType
        | ContinueType;
};

type ExpressionType = SingleExpressionType[] | SingleExpressionType;

var wordsPossibleChars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

function findStatementInsideDelimiters(
    str: TokenType[],
    startDelimiter: string,
    endDelimiter: string,
): TokenType[] {
    let numberOfOpeningDelimiters = 1;
    let numberOfClosingDelimiters = 0;
    let result = [str[0] ?? { type: "unknown", value: "" }];
    let length = 1;
    while (numberOfOpeningDelimiters != numberOfClosingDelimiters) {
        if (str[length] == undefined) return result;
        // @ts-ignore
        if (str[length].value === startDelimiter) {
            numberOfOpeningDelimiters++;
        }
        // @ts-ignore
        else if (str[length].value === endDelimiter) {
            numberOfClosingDelimiters++;
        }
        // @ts-ignore
        result.push(str[length]);
        length++;
    }
    return result;
}

Bun.file(fileName)
    .text()
    .then((content) => {
        handleFile(content);
    })
    .catch((error) => {
        console.error("Error reading file:", error);
    });

function handleFile(fileContent: string) {
    // start by removing comments
    let lines: (string | null | undefined)[] = fileContent.split("\n");

    let inCommentBlock = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (typeof line !== "string") continue;

        if (line.startsWith("/*")) {
            inCommentBlock = true;
        }
        if (inCommentBlock) {
            if (line.endsWith("*/")) {
                inCommentBlock = false;
            }
            lines[i] = null;
        }

        if (!inCommentBlock && line.includes("//")) {
            // remove everything after the first "//"
            const index = line.indexOf("//");
            lines[i] = line.substring(0, index);
        }
    }
    const outputLines = lines
        .filter(
            (line) => line != null && line != undefined && line.trim() != "",
        )
        .join("\n");

    var currentToken = "";
    var insideQuotes = false;
    var tokens: TokenType[] = [{ type: "curlyBrace", value: "{" }];

    var i = 0;
    while (i < outputLines.length) {
        const char = outputLines[i];

        if (!char) {
            i++;
            continue;
        }

        // handle strings
        if (insideQuotes || char == '"') {
            currentToken += char;
            if (char === '"') {
                if (insideQuotes) {
                    tokens.push({ type: "string", value: currentToken });
                    currentToken = "";
                }
                insideQuotes = !insideQuotes;
            }
        }

        // handle whitespaces
        else if (char == " " || char == "\n" || char == "\t") {
            i++;
            continue;
        } else if (char == "{" || char == "}") {
            tokens.push({ type: "bracket", value: char });
        } else if (char == "(" || char == ")") {
            tokens.push({ type: "parenthesis", value: char });
        } else if (char == ",") {
            tokens.push({ type: "comma", value: char });
        } else if (char == ";") {
            tokens.push({ type: "semicolon", value: char });
        } else if (char == "[" || char == "]") {
            tokens.push({ type: "squareBracket", value: char });
        } else if (char == ":") {
            tokens.push({ type: "colon", value: char });
        } else if (char == "=") {
            tokens.push({ type: "equal", value: char });
        } else if (
            char == "+" ||
            char == "-" ||
            char == "*" ||
            char == "/" ||
            char == "%" ||
            char == "^"
        ) {
            tokens.push({ type: "operator", value: char });
        } else if (char == "<" || char == ">") {
            if (outputLines[i + 1] == "=") {
                tokens.push({ type: "comparison", value: char + "=" });
                i++; // skip the next character
            } else {
                tokens.push({ type: "comparison", value: char });
            }
        } else if (char == "!") {
            if (outputLines[i + 1] == "=") {
                tokens.push({ type: "notEqual", value: "!=" });
                i++; // skip the next character
            } else {
                tokens.push({ type: "not", value: "!" });
            }
        } else if (char == "&" || char == "|") {
            if (outputLines[i + 1] == char) {
                tokens.push({ type: "logicalOperator", value: char + char });
                i++; // skip the next character
            }
        } else if (wordsPossibleChars.includes(char)) {
            currentToken += char;

            //@ts-ignore
            if (!wordsPossibleChars.includes(outputLines[i + 1])) {
                tokens.push({ type: "word", value: currentToken });
                currentToken = "";
            }
        }

        i++;
    }

    tokens.push({ type: "curlyBrace", value: "}" });

    let fetchedExpression: ExpressionType = fetchExpression(
        tokens.slice(1, -1),
    );
    // output the file to main.out
    Bun.write("main.out", JSON.stringify(fetchedExpression, null, 2));
}

function fetchExpression(tokens: TokenType[]): ExpressionType {
    if (tokens[0]?.value != "{") {
        return fetchSingleExpression(tokens);
    }
}

function fetchSingleExpression(tokens: TokenType[]): SingleExpressionType {
    if (tokens[0]?.type == "word" && tokens[0].value == "var") {
        return {
            type: "variableDeclaration",
            expression: fetchVariableDeclaration(tokens),
        };
    } else if (tokens[0]?.type == "word" && checkIfIsNumber(tokens[0].value)) {
        return {
            type: "number",
            expression: Number(tokens[0].value),
        };
    }
}

function fetchVariableDeclaration(
    tokens: TokenType[],
): VariableDeclarationType {
    if (!validBaseTypes.includes(tokens[1]?.value ?? "")) {
        throw new Error(
            `Invalid base type: ${tokens[1]?.value}. Valid types are: ${validBaseTypes.join(", ")}`,
        );
    }

    let tokensToLoop = tokens.slice(2);

    let size: ExpressionType = [];
    let token = findStatementInsideDelimiters(tokensToLoop, "[", "]");
    tokensToLoop = tokensToLoop.slice(token.length);
    size = fetchExpression(token.slice(1, -1));

    if (checkIfIsNumber(tokensToLoop[0]?.value))
        throw new Error("Variable name cannot be a number");
    if (ReservedKeywords.includes(tokensToLoop[0]?.value as string)) {
        throw new Error(
            `Variable name cannot be a reserved keyword: ${tokensToLoop[0]?.value}`,
        );
    }

    let variableName = tokensToLoop[0]?.value as string;
    tokensToLoop = tokensToLoop.slice(1);
    let expression: ExpressionType = [];
    expression = fetchExpression(tokensToLoop);
    return {
        type: {
            size: size,
            baseType: tokens[1]?.value as ValueTypes["baseType"],
        },
        name: variableName,
        expression: expression,
    };
}

function checkIfIsNumber(str: string | undefined): boolean {
    if (str === undefined) return false;
    return !isNaN(Number(str));
}
