# ============================================================
# QUEUE — Deep Practice (Beginner Friendly)
# ============================================================
#
# WHAT IS A QUEUE?
# ─────────────────
# A FIFO (First In, First Out) data structure.
# Think of a real-world queue/line — first person in is first served.
#
#   ENQUEUE (add) → add to REAR
#   DEQUEUE (remove) → remove from FRONT
#
#   FRONT → [10] [20] [30] [40] ← REAR
#            ↑                  ↑
#          dequeue           enqueue
#
# IMPLEMENTATION IN PYTHON:
#   Use collections.deque (double-ended queue) — O(1) both ends.
#   NEVER use plain list as queue: list.pop(0) is O(n)!
#
#   from collections import deque
#   q = deque()
#   q.append(x)      → enqueue (add to right)  O(1)
#   q.popleft()      → dequeue (remove left)   O(1)
#   q[0]             → peek front              O(1)
#   len(q) == 0      → is empty                O(1)
#
# WHEN TO USE A QUEUE:
#   ✓ BFS (Breadth First Search) — level-by-level traversal
#   ✓ Task scheduling (print queue, CPU scheduling)
#   ✓ Streaming data / moving windows
#   ✓ "Process in order" problems
#
# KEY INSIGHT — BFS TEMPLATE:
#   queue = deque([start])
#   visited = set([start])
#   while queue:
#       node = queue.popleft()
#       for neighbor in node.neighbors:
#           if neighbor not in visited:
#               visited.add(neighbor)
#               queue.append(neighbor)
# ============================================================

from collections import deque


# ──────────────────────────────────────────────────────────────
# QUEUE IMPLEMENTATION (from scratch for understanding)
# ──────────────────────────────────────────────────────────────

class Queue:
    def __init__(self):
        self._data = deque()       # deque gives O(1) on both ends

    def enqueue(self, val):
        """Add to rear — O(1)"""
        self._data.append(val)

    def dequeue(self):
        """Remove and return front — O(1)"""
        if self.is_empty():
            raise IndexError("dequeue from empty queue")
        return self._data.popleft()

    def peek(self):
        """Return front without removing — O(1)"""
        if self.is_empty():
            raise IndexError("peek from empty queue")
        return self._data[0]

    def is_empty(self):
        return len(self._data) == 0

    def __len__(self):
        return len(self._data)

    def __repr__(self):
        return f"Queue(front={self._data[0] if self._data else None})"


# ──────────────────────────────────────────────────────────────
# EXERCISE 1 (Easy): Implement Queue Using Two Stacks
# ──────────────────────────────────────────────────────────────
# Without using deque, build a queue using only two Python lists
# (which act as stacks — only use append and pop).
#
# Operations: enqueue(val), dequeue() → val, peek() → val, is_empty()
#
# TRICK:
#   stack_in  → receives all new elements (enqueue)
#   stack_out → serves all dequeue/peek requests
#   When stack_out is empty: pour all of stack_in into stack_out
#   (this reverses the order, making the oldest item on top)

class QueueWithTwoStacks:
    def __init__(self):
        # TODO
        # self.stack_in = []
        # self.stack_out = []
        pass

    def _transfer(self):
        # TODO: pour stack_in into stack_out if stack_out is empty
        pass

    def enqueue(self, val):
        # TODO
        pass

    def dequeue(self):
        # TODO
        pass

    def peek(self):
        # TODO
        pass

    def is_empty(self):
        # TODO
        pass


class QueueWithTwoStacks_Solution:
    def __init__(self):
        self.stack_in = []     # receives new elements
        self.stack_out = []    # serves dequeue/peek

    def _transfer(self):
        if not self.stack_out:                     # only transfer when needed
            while self.stack_in:
                self.stack_out.append(self.stack_in.pop())

    def enqueue(self, val):
        self.stack_in.append(val)

    def dequeue(self):
        self._transfer()
        return self.stack_out.pop()

    def peek(self):
        self._transfer()
        return self.stack_out[-1]

    def is_empty(self):
        return not self.stack_in and not self.stack_out


# ──────────────────────────────────────────────────────────────
# EXERCISE 2 (Easy): Generate Binary Numbers 1..N Using a Queue
# ──────────────────────────────────────────────────────────────
# Given N, generate binary representations of 1 to N.
#
# Example:
#   N=5  →  ["1", "10", "11", "100", "101"]
#
# TRICK:
#   Start with "1" in queue.
#   Each iteration: dequeue "x", record it,
#   then enqueue "x0" and "x1" (append 0 and 1).

def generate_binary(n):
    # TODO
    # q = deque(["1"])
    # result = []
    # for _ in range(n):
    #     front = q.popleft()
    #     result.append(front)
    #     q.append(front + "0")
    #     q.append(front + "1")
    # return result
    pass


def generate_binary_solution(n):
    q = deque(["1"])
    result = []
    for _ in range(n):
        front = q.popleft()
        result.append(front)
        q.append(front + "0")    # left child in binary tree of numbers
        q.append(front + "1")    # right child
    return result


# ──────────────────────────────────────────────────────────────
# EXERCISE 3 (Medium): Moving Average of Last K Elements
# ──────────────────────────────────────────────────────────────
# Design a class that computes the moving average of the last k
# elements in a stream of integers.
#
# Example:
#   k=3, stream: 1, 10, 3, 5
#   After 1:    1/1  = 1.0
#   After 10:   11/2 = 5.5
#   After 3:    14/3 = 4.667
#   After 5:    18/3 = 6.0  (window is [10, 3, 5])
#
# TRICK:
#   Use a deque of max size k.
#   Keep a running sum — add new, subtract oldest if window full.

class MovingAverage:
    def __init__(self, k):
        # TODO
        pass

    def next(self, val):
        # TODO
        pass


class MovingAverage_Solution:
    def __init__(self, k):
        self.k = k
        self.window = deque()
        self.total = 0

    def next(self, val):
        self.window.append(val)
        self.total += val
        if len(self.window) > self.k:
            self.total -= self.window.popleft()   # remove oldest
        return self.total / len(self.window)


# ──────────────────────────────────────────────────────────────
# EXERCISE 4 (Medium): BFS — Shortest Path in Binary Matrix
# ──────────────────────────────────────────────────────────────
# In an N×N grid, 0=open, 1=blocked.
# Find the shortest path (by cells visited) from top-left (0,0)
# to bottom-right (N-1,N-1). Move in 8 directions.
# Return path length, or -1 if impossible.
#
# Example:
#   grid = [[0,0,0],
#           [1,1,0],
#           [1,1,0]]
#   Output: 4  (path: (0,0)→(0,1)→(0,2)→(1,2)→(2,2) = 4 cells? wait
#               but diagonals allowed: (0,0)→(0,1)→(1,2)→(2,2)=4 cells)

def shortest_path_binary_matrix(grid):
    # TODO
    # if grid[0][0] == 1 or grid[-1][-1] == 1: return -1
    # n = len(grid)
    # q = deque([(0, 0, 1)])   ← (row, col, path_length)
    # visited = {(0, 0)}
    # 8 directions: [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
    # BFS: dequeue, check if destination, enqueue valid neighbors
    pass


def shortest_path_binary_matrix_solution(grid):
    n = len(grid)
    if grid[0][0] == 1 or grid[n-1][n-1] == 1:
        return -1
    if n == 1:
        return 1
    directions = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
    q = deque([(0, 0, 1)])     # (row, col, path_length)
    visited = {(0, 0)}
    while q:
        r, c, dist = q.popleft()
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0 and (nr, nc) not in visited:
                if nr == n - 1 and nc == n - 1:
                    return dist + 1
                visited.add((nr, nc))
                q.append((nr, nc, dist + 1))
    return -1


# ──────────────────────────────────────────────────────────────
# EXERCISE 5 (Medium): First Non-Repeating Character in a Stream
# ──────────────────────────────────────────────────────────────
# Given a stream of characters (one at a time), after each
# character is added, return the FIRST character that has
# appeared exactly once so far. Return '#' if none exists.
#
# Example:
#   stream: a, a, b, c
#   After a: 'a'
#   After a: '#'  (a appeared twice, nothing unique)
#   After b: 'b'
#   After c: 'b'  (b is still unique and came before c)
#
# TRICK:
#   Queue stores candidates (in order of appearance).
#   Dict tracks frequency.
#   Peek front: if freq > 1, discard it (not unique anymore).

def first_non_repeating(stream):
    # TODO
    # q = deque()
    # freq = {}
    # result = []
    # for ch in stream:
    #     freq[ch] = freq.get(ch, 0) + 1
    #     q.append(ch)
    #     while q and freq[q[0]] > 1:  ← discard repeated front
    #         q.popleft()
    #     result.append(q[0] if q else '#')
    # return result
    pass


def first_non_repeating_solution(stream):
    q = deque()
    freq = {}
    result = []
    for ch in stream:
        freq[ch] = freq.get(ch, 0) + 1
        q.append(ch)
        while q and freq[q[0]] > 1:   # front is no longer unique
            q.popleft()
        result.append(q[0] if q else '#')
    return result


# ──────────────────────────────────────────────────────────────
# TESTS
# ──────────────────────────────────────────────────────────────
def test_all():
    print("=" * 50)
    print("QUEUE TESTS")
    print("=" * 50)

    # Built-in Queue class
    q = Queue()
    q.enqueue(1); q.enqueue(2); q.enqueue(3)
    assert q.peek() == 1
    assert q.dequeue() == 1
    assert q.dequeue() == 2
    assert len(q) == 1
    print("Built-in Queue class                 PASS")

    # Exercise 1: Queue with Two Stacks
    q2 = QueueWithTwoStacks_Solution()
    q2.enqueue(1); q2.enqueue(2); q2.enqueue(3)
    assert q2.peek() == 1
    assert q2.dequeue() == 1
    assert q2.dequeue() == 2
    assert not q2.is_empty()
    print("Exercise 1 (Queue w/ Two Stacks)     PASS")

    # Exercise 2: Generate Binary
    assert generate_binary_solution(5) == ["1","10","11","100","101"]
    assert generate_binary_solution(3) == ["1","10","11"]
    print("Exercise 2 (Generate Binary)         PASS")

    # Exercise 3: Moving Average
    ma = MovingAverage_Solution(3)
    assert ma.next(1)  == 1.0
    assert abs(ma.next(10) - 5.5)   < 1e-9
    assert abs(ma.next(3)  - 4.6667) < 0.001
    assert abs(ma.next(5)  - 6.0)   < 1e-9
    print("Exercise 3 (Moving Average)          PASS")

    # Exercise 4: BFS Shortest Path
    grid1 = [[0,0,0],[1,1,0],[1,1,0]]
    assert shortest_path_binary_matrix_solution(grid1) == 4
    grid2 = [[1,0,0],[1,1,0],[1,1,0]]
    assert shortest_path_binary_matrix_solution(grid2) == -1
    grid3 = [[0]]
    assert shortest_path_binary_matrix_solution(grid3) == 1
    print("Exercise 4 (BFS Shortest Path)       PASS")

    # Exercise 5: First Non-Repeating
    assert first_non_repeating_solution("aabc") == ['a','#','b','b']
    assert first_non_repeating_solution("aab")  == ['a','#','b']
    print("Exercise 5 (First Non-Repeating)     PASS")

    print()
    print("All solution tests passed!")
    print()
    print("NOW TRY: Fill in the TODO functions above and test YOUR answers.")


if __name__ == "__main__":
    test_all()
