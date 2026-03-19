# ============================================================
# STACK — Deep Practice (Beginner Friendly)
# ============================================================
#
# WHAT IS A STACK?
# ─────────────────
# A LIFO (Last In, First Out) data structure.
# Think of a stack of plates — you add and remove from the TOP.
#
#   PUSH  →  add to top
#   POP   →  remove from top
#   PEEK  →  look at top (no remove)
#
#   [ 10 ]  ← top (pushed last, popped first)
#   [ 20 ]
#   [ 30 ]  ← bottom (pushed first, popped last)
#
# IMPLEMENTATION IN PYTHON:
#   Use a plain Python list.
#   list.append(x)  → push   O(1)
#   list.pop()      → pop    O(1)
#   list[-1]        → peek   O(1)
#   len(list) == 0  → empty  O(1)
#
# WHEN TO USE A STACK:
#   ✓ Matching brackets / parentheses
#   ✓ Undo / Redo operations
#   ✓ DFS (Depth First Search)
#   ✓ Expression evaluation
#   ✓ "Next greater element" problems
#   ✓ Monotonic stack patterns
#
# COMMON PATTERN — Monotonic Stack:
#   Keep the stack in increasing or decreasing order.
#   When a new element breaks the order → pop and process.
# ============================================================


# ──────────────────────────────────────────────────────────────
# STACK IMPLEMENTATION (from scratch for understanding)
# ──────────────────────────────────────────────────────────────

class Stack:
    def __init__(self):
        self._data = []            # internal list

    def push(self, val):
        """Add to top — O(1)"""
        self._data.append(val)

    def pop(self):
        """Remove and return top — O(1). Raises if empty."""
        if self.is_empty():
            raise IndexError("pop from empty stack")
        return self._data.pop()

    def peek(self):
        """Return top without removing — O(1)"""
        if self.is_empty():
            raise IndexError("peek from empty stack")
        return self._data[-1]

    def is_empty(self):
        return len(self._data) == 0

    def __len__(self):
        return len(self._data)

    def __repr__(self):
        return f"Stack(top={self._data[-1] if self._data else None})"


# ──────────────────────────────────────────────────────────────
# EXERCISE 1 (Easy): Valid Parentheses
# ──────────────────────────────────────────────────────────────
# Given a string with '(', ')', '{', '}', '[', ']',
# return True if the brackets are correctly matched and ordered.
#
# Example:
#   "([])"      →  True
#   "()[]{}"    →  True
#   "(]"        →  False
#   "([)]"      →  False
#   ""          →  True
#
# TRICK:
#   Push opening brackets onto stack.
#   On closing bracket: peek stack — does it match?
#   If yes, pop. If no (or stack empty), return False.
#   At end, stack must be empty.

def is_valid_parentheses(s):
    # TODO
    # matching = {')': '(', ']': '[', '}': '{'}
    # stack = []
    # for ch in s:
    #     if ch in '([{': stack.append(ch)
    #     else:
    #         if not stack or stack[-1] != matching[ch]: return False
    #         stack.pop()
    # return len(stack) == 0
    pass


def is_valid_parentheses_solution(s):
    matching = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        else:
            if not stack or stack[-1] != matching[ch]:
                return False
            stack.pop()
    return len(stack) == 0


# ──────────────────────────────────────────────────────────────
# EXERCISE 2 (Easy): Reverse a String Using a Stack
# ──────────────────────────────────────────────────────────────
# Push all characters onto a stack, then pop them all off.
# The result is the reversed string.
#
# Example:
#   "hello"  →  "olleh"

def reverse_string(s):
    # TODO
    # Push each char onto stack
    # Pop each char and build result
    pass


def reverse_string_solution(s):
    stack = list(s)            # push all chars
    result = []
    while stack:
        result.append(stack.pop())   # pop = last in, first out
    return "".join(result)


# ──────────────────────────────────────────────────────────────
# EXERCISE 3 (Medium): Min Stack
# ──────────────────────────────────────────────────────────────
# Design a stack that supports push, pop, peek, and getMin,
# where getMin returns the MINIMUM element in the stack.
# All operations must be O(1).
#
# Example:
#   push(5), push(3), push(7), push(1)
#   getMin() → 1
#   pop()    → 1
#   getMin() → 3
#
# TRICK:
#   Maintain a SECOND stack that tracks the current minimum.
#   When pushing x: also push min(x, min_stack.top) onto min_stack.
#   When popping: pop from both stacks.

class MinStack:
    def __init__(self):
        # TODO
        # self.stack = []
        # self.min_stack = []   ← tracks min at each level
        pass

    def push(self, val):
        # TODO
        pass

    def pop(self):
        # TODO
        pass

    def peek(self):
        # TODO
        pass

    def get_min(self):
        # TODO
        pass


class MinStack_Solution:
    def __init__(self):
        self.stack = []
        self.min_stack = []        # min_stack[i] = min of stack[0..i]

    def push(self, val):
        self.stack.append(val)
        current_min = min(val, self.min_stack[-1]) if self.min_stack else val
        self.min_stack.append(current_min)

    def pop(self):
        self.stack.pop()
        self.min_stack.pop()

    def peek(self):
        return self.stack[-1]

    def get_min(self):
        return self.min_stack[-1]


# ──────────────────────────────────────────────────────────────
# EXERCISE 4 (Medium): Daily Temperatures
# ──────────────────────────────────────────────────────────────
# Given a list of daily temperatures, return a list where each
# element is the number of days until a WARMER temperature.
# If there's no warmer day, put 0.
#
# Example:
#   temps = [73, 74, 75, 71, 69, 72, 76, 73]
#   Output:  [ 1,  1,  4,  2,  1,  1,  0,  0]
#
# TRICK: Monotonic Decreasing Stack
#   Stack stores INDICES of temperatures.
#   For each day i, while stack top's temp < temps[i]:
#     pop it, answer[popped_index] = i - popped_index
#   Push current index.

def daily_temperatures(temps):
    # TODO
    # answer = [0] * len(temps)
    # stack = []   ← stores indices
    # for i, t in enumerate(temps):
    #     while stack and temps[stack[-1]] < t:
    #         j = stack.pop()
    #         answer[j] = i - j
    #     stack.append(i)
    # return answer
    pass


def daily_temperatures_solution(temps):
    answer = [0] * len(temps)
    stack = []                      # stores indices
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            answer[j] = i - j      # days until warmer
        stack.append(i)
    return answer


# ──────────────────────────────────────────────────────────────
# EXERCISE 5 (Medium): Evaluate Reverse Polish Notation (RPN)
# ──────────────────────────────────────────────────────────────
# Evaluate a math expression given in Reverse Polish Notation.
# Operators: '+', '-', '*', '//' (integer division toward zero)
#
# Example:
#   ["2", "1", "+", "3", "*"]  →  9   ((2+1)*3)
#   ["4", "13", "5", "/", "+"] →  6   (4 + 13//5 = 4+2 = 6)
#
# TRICK:
#   Push numbers onto stack.
#   On operator: pop TWO numbers, apply op, push result.

def eval_rpn(tokens):
    # TODO
    # stack = []
    # for token in tokens:
    #     if token in {'+', '-', '*', '/'}:
    #         b = stack.pop(); a = stack.pop()
    #         compute result and push
    #     else:
    #         stack.append(int(token))
    # return stack[0]
    pass


def eval_rpn_solution(tokens):
    stack = []
    ops = {
        '+': lambda a, b: a + b,
        '-': lambda a, b: a - b,
        '*': lambda a, b: a * b,
        '/': lambda a, b: int(a / b),   # truncate toward zero
    }
    for token in tokens:
        if token in ops:
            b = stack.pop()             # second operand
            a = stack.pop()             # first operand
            stack.append(ops[token](a, b))
        else:
            stack.append(int(token))
    return stack[0]


# ──────────────────────────────────────────────────────────────
# EXERCISE 6 (Hard): Largest Rectangle in Histogram
# ──────────────────────────────────────────────────────────────
# Given an array of bar heights, find the area of the largest
# rectangle that fits inside the histogram.
#
# Example:
#   heights = [2, 1, 5, 6, 2, 3]  →  10
#   (the rectangle spans heights 5 and 6, area = 2*5 = 10)
#
# TRICK: Monotonic Increasing Stack
#   Stack stores indices of heights in increasing order.
#   When a bar is SHORTER than the top of stack:
#     pop and calculate the rectangle using that height.
#   Append a 0-height sentinel at the end to flush everything.

def largest_rectangle(heights):
    # TODO
    # stack = []  ← stores indices, heights are increasing
    # heights = heights + [0]   ← sentinel
    # for i, h in enumerate(heights):
    #     while stack and heights[stack[-1]] > h:
    #         height = heights[stack.pop()]
    #         width  = i if not stack else i - stack[-1] - 1
    #         max_area = max(max_area, height * width)
    #     stack.append(i)
    pass


def largest_rectangle_solution(heights):
    heights = heights + [0]        # sentinel forces stack to flush
    stack = []                     # stores indices, increasing heights
    max_area = 0
    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)
    return max_area


# ──────────────────────────────────────────────────────────────
# TESTS
# ──────────────────────────────────────────────────────────────
def test_all():
    print("=" * 50)
    print("STACK TESTS")
    print("=" * 50)

    # Exercise 1: Valid Parentheses
    assert is_valid_parentheses_solution("([])") == True
    assert is_valid_parentheses_solution("()[]{}") == True
    assert is_valid_parentheses_solution("(]") == False
    assert is_valid_parentheses_solution("([)]") == False
    assert is_valid_parentheses_solution("") == True
    print("Exercise 1 (Valid Parentheses)       PASS")

    # Exercise 2: Reverse String
    assert reverse_string_solution("hello") == "olleh"
    assert reverse_string_solution("a") == "a"
    assert reverse_string_solution("") == ""
    print("Exercise 2 (Reverse String)          PASS")

    # Exercise 3: Min Stack
    ms = MinStack_Solution()
    ms.push(5); ms.push(3); ms.push(7); ms.push(1)
    assert ms.get_min() == 1
    ms.pop()
    assert ms.get_min() == 3
    assert ms.peek() == 7
    print("Exercise 3 (Min Stack)               PASS")

    # Exercise 4: Daily Temperatures
    assert daily_temperatures_solution([73,74,75,71,69,72,76,73]) == [1,1,4,2,1,1,0,0]
    assert daily_temperatures_solution([30, 40, 50, 60]) == [1, 1, 1, 0]
    assert daily_temperatures_solution([30, 60, 90]) == [1, 1, 0]
    print("Exercise 4 (Daily Temperatures)      PASS")

    # Exercise 5: Evaluate RPN
    assert eval_rpn_solution(["2","1","+","3","*"]) == 9
    assert eval_rpn_solution(["4","13","5","/","+"]) == 6
    assert eval_rpn_solution(["10","6","9","3","+","-11","*","/","*","17","+","5","+"]) == 22
    print("Exercise 5 (Evaluate RPN)            PASS")

    # Exercise 6: Largest Rectangle
    assert largest_rectangle_solution([2,1,5,6,2,3]) == 10
    assert largest_rectangle_solution([2,4]) == 4
    assert largest_rectangle_solution([1]) == 1
    print("Exercise 6 (Largest Rectangle)       PASS")

    print()
    print("All solution tests passed!")
    print()
    print("NOW TRY: Fill in the TODO functions above and test YOUR answers.")


if __name__ == "__main__":
    test_all()
