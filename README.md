# compiler-ling-par

[![Compilation Status](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)

![Diagrama Sintático](https://compiler-tester.insper-comp.com.br/ds?version=v2.0)

```ebnf
PROGRAM = { STATEMENT } ;
STATEMENT = ( "Println", "(", BOOL_EXPRESSION, ")" | IDENTIFIER, "=", BOOL_EXPRESSION | "if", BOOL_EXPRESSION, BLOCK, [ "else", BLOCK ] | "for", BOOL_EXPRESSION, BLOCK | Ε ), "\n" ;
BLOCK = "{", { STATEMENT }, "}" ;
BOOL_EXPRESSION = BOOL_TERM, { "||", BOOL_TERM } ;
BOOL_TERM = REL_EXPRESSION, { "&&", REL_EXPRESSION } ;
REL_EXPRESSION = EXPRESSION, [ ( "==" | ">" | "<" ), EXPRESSION ] ;
EXPRESSION = TERM, { ( "+" | "-" ), TERM } ;
TERM = FACTOR, { ( "*" | "/" ), FACTOR } ;
FACTOR = NUMBER | IDENTIFIER | ( "+" | "-" | "!" ), FACTOR | "(", BOOL_EXPRESSION, ")" | "Scanln", "(", ")" ;
IDENTIFIER = LETTER, { LETTER | DIGIT | "_" } ;
NUMBER = DIGIT, { DIGIT } ;
LETTER = "a" | "b" | ... | "z" | "A" | "B" | ... | "Z" ;
DIGIT = "0" | "1" | ... | "9" ;
```