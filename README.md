# Syntax for the programming language :

## Expressions :

### Write the expression directly. 
example: "a + b"

### Use curly braces for complex expressions.
If you do this, you will need to use the `return` keyword to return the result.
example: "{
    return a + b;
}"
Inside declarations, every statement must end with a semicolon.

## Declarations:

### Use the var keyword to declare variables, followed by the type. Then an equal sign and an expression.
example: "var int16 a = 5"
example: "var string<8> name = 'John Doe'"

### Use the func keyword to declare functions, followed by the type signature in angle brackets. Then an equal sign and an expression.
example: "func <int32, int32 => int32> add = (a, b) => a + b"

## Use the mod keyword to modify a variable value.
example: "{
    var int32 a = 5;
    mod a = a + 1;
}"

## Reallocation:

### Use the realloc keyword to reallocate memory for a variable.
example: "{
    var int32 a = 5;
    realloc a int64;
    mod a = 10;
}"

## If else statements:

### Use the if keyword followed by an expression. Then use the do keyword and another expression for the true case. Use else if for additional conditions and else for the false case.
example: "{
    var int32 a = 5;
    if a > 0 do 
        'Positive';
    else if {a < 0} do {
        return 'Negative';
    } else do {
        return 'Zero';
    }
}"

## Loops:
### Use the while keyword followed by an expression. Then use the do keyword and another expression for the loop body.
example: "{
    var int32 i = 0;
    while i < 10 do {
        mod i = i + 1;
    }
}"
### Use the continue/break keywords to control the loop flow.
example: "{
    var int32 i = 0;
    while i < 10 do {
        if i == 5 do {
            continue; // Skip the rest of the loop body when i is 5
        }
        if i == 8 do {
            break; // Exit the loop when i is 8
        }
        mod i = i + 1;
    }
}"

## Comments:
### Use the // syntax for single-line comments.
### Use the /* ... */ syntax for multi-line comments.
example: "// This is a single-line comment"
example: "/* This is a
multi-line comment */"

## Syscalls:
### Use the syscall keyword followed by the syscall number and the arguments in parentheses.
example: "syscall 1(5, 10)" // This would call syscall number 1 with arguments 5 and 10.

## TODO : Implement the following features:
1. Support for lists.
2. Support for dictionaries.
