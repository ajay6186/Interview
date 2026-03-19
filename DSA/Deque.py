# ============================================================
# DEQUE — Deep Practice (Beginner Friendly)
# ============================================================
#
# WHAT IS A DEQUE?
# ─────────────────
# Deque = Double-Ended Queue (pronounced "deck").
# You can add and remove from BOTH FRONT and BACK in O(1).
#
#   appendleft(x)  →  add to FRONT    O(1)
#   append(x)      →  add to REAR     O(1)
#   popleft()      →  remove FRONT    O(1)
#   pop()          →  remove REAR     O(1)
#   d[0]           →  peek FRONT      O(1)
#   d[-1]          →  peek REAR       O(1)
#
#   FRONT ← [10] [20] [30] [40] → REAR
#
# PYTHON USAGE:
#   from collections import deque
#   d = deque()
#   d = deque([1, 2, 3])           # initialize from list
#   d = deque(maxlen=k)            # fixed-size window (auto-evicts)
#
# DEQUE vs STACK vs QUEUE:
#   Stack  → only use append + pop           (LIFO, right side only)
#   Queue  → only use append + popleft       (FIFO, both sides)
#   Deque  → use ALL four operations         (both sides)
#
# WHEN TO USE A DEQUE:
#   ✓ Sliding window MAXIMUM / MINIMUM
#   ✓ Implementing both stack AND queue behavior
#   ✓ BFS with priority (0-1 BFS: push 0-cost to front, 1-cost to back)
#   ✓ Palindrome checking
#   ✓ Circular buffer / cache eviction
#
# CLASSIC PATTERN — Monotonic Deque (Sliding Window Max):
#   Keep indices in deque, values are decreasing (for max).
#   1. Remove indices outside the window from the FRONT.
#   2. Remove indices from the BACK whose values < current value.
#   3. Append current index to BACK.
#   4. Front of deque = index of max in current window.
# ============================================================

from collections import deque


# ──────────────────────────────────────────────────────────────
# DEQUE CHEAT SHEET (run this to see all operations)
# ──────────────────────────────────────────────────────────────

def deque_demo():
    d = deque([1, 2, 3])
    print("Initial:", list(d))          # [1, 2, 3]

    d.append(4)                         # add to right
    print("append(4):", list(d))        # [1, 2, 3, 4]

    d.appendleft(0)                     # add to left
    print("appendleft(0):", list(d))    # [0, 1, 2, 3, 4]

    d.pop()                             # remove from right
    print("pop():", list(d))            # [0, 1, 2, 3]

    d.popleft()                         # remove from left
    print("popleft():", list(d))        # [1, 2, 3]

    print("front d[0]:", d[0])          # 1
    print("back  d[-1]:", d[-1])        # 3


# ──────────────────────────────────────────────────────────────
# EXERCISE 1 (Easy): Implement a Stack Using Deque
# ──────────────────────────────────────────────────────────────
# Build a Stack (LIFO) using only a deque.
# Operations: push(val), pop() → val, peek() → val, is_empty()
#
# TRICK: only use append() and pop() (right side = top of stack)

class StackUsingDeque:
    def __init__(self):
        # TODO
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

    def is_empty(self):
        # TODO
        pass


class StackUsingDeque_Solution:
    def __init__(self):
        self.d = deque()

    def push(self, val):
        self.d.append(val)          # add to right = top

    def pop(self):
        return self.d.pop()         # remove from right = top

    def peek(self):
        return self.d[-1]           # peek right = top

    def is_empty(self):
        return len(self.d) == 0


# ──────────────────────────────────────────────────────────────
# EXERCISE 2 (Easy): Palindrome Check Using Deque
# ──────────────────────────────────────────────────────────────
# Check if a string is a palindrome using a deque.
# Ignore case and non-alphanumeric characters.
#
# Example:
#   "racecar"               →  True
#   "A man a plan a canal Panama"  →  True  (ignore spaces)
#   "hello"                 →  False
#
# TRICK:
#   Load all valid chars into a deque.
#   While len > 1: compare popleft() with pop().
#   If they differ → not a palindrome.

def is_palindrome(s):
    # TODO
    # d = deque(ch.lower() for ch in s if ch.isalnum())
    # while len(d) > 1:
    #     if d.popleft() != d.pop(): return False
    # return True
    pass


def is_palindrome_solution(s):
    d = deque(ch.lower() for ch in s if ch.isalnum())
    while len(d) > 1:
        if d.popleft() != d.pop():
            return False
    return True


# ──────────────────────────────────────────────────────────────
# EXERCISE 3 (Medium): Sliding Window Maximum
# ──────────────────────────────────────────────────────────────
# Given an array and window size k, return the maximum value
# of each window as it slides from left to right.
#
# Example:
#   nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
#   Windows:  [1,3,-1]=3  [3,-1,-3]=3  [-1,-3,5]=5
#             [-3,5,3]=5  [5,3,6]=6   [3,6,7]=7
#   Output:   [3, 3, 5, 5, 6, 7]
#
# TRICK: Monotonic Decreasing Deque (stores INDICES)
#   For each i:
#   1. Remove from FRONT if index is outside window (i - d[0] >= k)
#   2. Remove from BACK  while nums[back] <= nums[i]  (smaller = useless)
#   3. Append i to BACK
#   4. Once i >= k-1: d[0] is index of window max → record nums[d[0]]

def sliding_window_max(nums, k):
    # TODO
    # d = deque()   ← stores indices, values are decreasing
    # result = []
    # for i in range(len(nums)):
    #     # step 1: remove out-of-window indices from front
    #     # step 2: remove smaller indices from back
    #     # step 3: add current index
    #     # step 4: record max when window is full
    # return result
    pass


def sliding_window_max_solution(nums, k):
    d = deque()          # stores indices; nums[d[i]] is decreasing
    result = []
    for i in range(len(nums)):
        # 1. remove indices outside the window from front
        if d and i - d[0] >= k:
            d.popleft()
        # 2. remove smaller values from back (they can never be the max)
        while d and nums[d[-1]] <= nums[i]:
            d.pop()
        # 3. add current index
        d.append(i)
        # 4. record the max when window is full
        if i >= k - 1:
            result.append(nums[d[0]])
    return result


# ──────────────────────────────────────────────────────────────
# EXERCISE 4 (Medium): Sliding Window Minimum
# ──────────────────────────────────────────────────────────────
# Same as above but find the MINIMUM in each window.
#
# Example:
#   nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
#   Output: [-1, -3, -3, -3, 3, 3]
#
# TRICK: Same as max but use INCREASING deque instead.
#   Remove from back while nums[back] >= nums[i]  (larger = useless for min)

def sliding_window_min(nums, k):
    # TODO (same structure as max, just flip the comparison on step 2)
    pass


def sliding_window_min_solution(nums, k):
    d = deque()          # stores indices; nums[d[i]] is increasing
    result = []
    for i in range(len(nums)):
        if d and i - d[0] >= k:
            d.popleft()
        while d and nums[d[-1]] >= nums[i]:   # ← flip: remove larger
            d.pop()
        d.append(i)
        if i >= k - 1:
            result.append(nums[d[0]])
    return result


# ──────────────────────────────────────────────────────────────
# EXERCISE 5 (Medium): Max of Each Subarray of Size K (same as Ex3)
# — but now return the SUM instead of the MAX
# ──────────────────────────────────────────────────────────────
# Use deque as a fixed-size window (maxlen=k).
# This version demonstrates deque(maxlen=k) — auto-evicts oldest.
#
# Example:
#   nums = [2, 1, 5, 1, 3, 2], k = 3
#   Sums: [8, 7, 9, 6]
#
# TRICK: deque(maxlen=k) automatically pops from the left when full.

def subarray_sums_deque(nums, k):
    # TODO
    # window = deque(maxlen=k)
    # result = []
    # for num in nums:
    #     window.append(num)            ← auto-evicts if len > k
    #     if len(window) == k:
    #         result.append(sum(window))
    # return result
    pass


def subarray_sums_deque_solution(nums, k):
    window = deque(maxlen=k)    # auto-evicts oldest when appending beyond maxlen
    result = []
    for num in nums:
        window.append(num)
        if len(window) == k:
            result.append(sum(window))
    return result


# ──────────────────────────────────────────────────────────────
# EXERCISE 6 (Hard): Shortest Subarray with Sum >= K
# ──────────────────────────────────────────────────────────────
# Given an integer array (may contain NEGATIVES) and integer k,
# return the length of the shortest subarray with sum >= k.
# Return -1 if no such subarray exists.
#
# Example:
#   nums = [2, -1, 2], k = 3  →  3  (whole array sum = 3)
#   nums = [1, 2],     k = 4  →  -1
#
# TRICK: Prefix sums + Monotonic Deque
#   prefix[i] = sum of nums[0..i-1]
#   For each j: we want the largest i < j such that
#     prefix[j] - prefix[i] >= k  AND  j - i is minimized
#   Use a deque to store indices with INCREASING prefix sums.
#   For each j: pop from FRONT while prefix[j] - prefix[front] >= k.

def shortest_subarray_sum_gte(nums, k):
    # TODO
    # n = len(nums)
    # prefix = [0] * (n + 1)
    # for i in range(n): prefix[i+1] = prefix[i] + nums[i]
    # d = deque()
    # best = float('inf')
    # for j in range(n + 1):
    #     while d and prefix[j] - prefix[d[0]] >= k:
    #         best = min(best, j - d.popleft())
    #     while d and prefix[d[-1]] >= prefix[j]:
    #         d.pop()
    #     d.append(j)
    # return best if best != float('inf') else -1
    pass


def shortest_subarray_sum_gte_solution(nums, k):
    n = len(nums)
    # prefix[i] = sum of nums[0..i-1]; prefix[0] = 0
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]

    d = deque()         # stores indices, prefix values are increasing
    best = float('inf')

    for j in range(n + 1):
        # Pop front: valid subarrays end at j
        while d and prefix[j] - prefix[d[0]] >= k:
            best = min(best, j - d.popleft())
        # Pop back: maintain increasing prefix order
        while d and prefix[d[-1]] >= prefix[j]:
            d.pop()
        d.append(j)

    return best if best != float('inf') else -1


# ──────────────────────────────────────────────────────────────
# TESTS
# ──────────────────────────────────────────────────────────────
def test_all():
    print("=" * 50)
    print("DEQUE TESTS")
    print("=" * 50)

    # Exercise 1: Stack using Deque
    s = StackUsingDeque_Solution()
    s.push(1); s.push(2); s.push(3)
    assert s.peek() == 3
    assert s.pop() == 3
    assert s.pop() == 2
    assert not s.is_empty()
    print("Exercise 1 (Stack Using Deque)       PASS")

    # Exercise 2: Palindrome
    assert is_palindrome_solution("racecar") == True
    assert is_palindrome_solution("A man a plan a canal Panama") == True
    assert is_palindrome_solution("hello") == False
    assert is_palindrome_solution("a") == True
    print("Exercise 2 (Palindrome Check)        PASS")

    # Exercise 3: Sliding Window Maximum
    assert sliding_window_max_solution([1,3,-1,-3,5,3,6,7], 3) == [3,3,5,5,6,7]
    assert sliding_window_max_solution([1], 1) == [1]
    assert sliding_window_max_solution([9,11], 2) == [11]
    print("Exercise 3 (Sliding Window Max)      PASS")

    # Exercise 4: Sliding Window Minimum
    assert sliding_window_min_solution([1,3,-1,-3,5,3,6,7], 3) == [-1,-3,-3,-3,3,3]
    assert sliding_window_min_solution([1], 1) == [1]
    print("Exercise 4 (Sliding Window Min)      PASS")

    # Exercise 5: Subarray Sums with Deque
    assert subarray_sums_deque_solution([2,1,5,1,3,2], 3) == [8,7,9,6]
    assert subarray_sums_deque_solution([1,2,3,4], 2) == [3,5,7]
    print("Exercise 5 (Subarray Sums Deque)     PASS")

    # Exercise 6: Shortest Subarray Sum >= K
    assert shortest_subarray_sum_gte_solution([2,-1,2], 3) == 3
    assert shortest_subarray_sum_gte_solution([1,2], 4) == -1
    assert shortest_subarray_sum_gte_solution([1,2,3], 3) == 1
    print("Exercise 6 (Shortest Subarray >=K)   PASS")

    print()
    print("All solution tests passed!")
    print()
    print("NOW TRY: Fill in the TODO functions above and test YOUR answers.")


if __name__ == "__main__":
    # deque_demo()   # uncomment to see deque operations
    test_all()
