# ============================================================
# SLIDING WINDOW — Deep Practice (Beginner Friendly)
# ============================================================
# TWO TYPES:
#
# 1. FIXED WINDOW (size k stays constant)
#    ──────────────────────────────────────
#    Template:
#      window_sum = sum(nums[:k])         ← compute first window
#      for i in range(k, len(nums)):
#          window_sum += nums[i]          ← add new right element
#          window_sum -= nums[i - k]      ← remove old left element
#          update answer
#
# 2. VARIABLE WINDOW (expand right, shrink left when invalid)
#    ──────────────────────────────────────────────────────────
#    Template:
#      left = 0
#      for right in range(len(nums)):
#          ADD nums[right] to window
#          while window is INVALID:
#              REMOVE nums[left] from window
#              left += 1
#          update answer with (right - left + 1)
# ============================================================


# ──────────────────────────────────────────────────────────────
# EXERCISE 1 (Easy): Max Sum of Subarray of Size K  [FIXED]
# ──────────────────────────────────────────────────────────────
# Find the maximum sum of any contiguous subarray of length k.
#
# Example:
#   nums = [2, 1, 5, 1, 3, 2], k = 3
#   Windows: [2,1,5]=8, [1,5,1]=7, [5,1,3]=9, [1,3,2]=6
#   Answer: 9

def max_sum_fixed_window(nums, k):
    # TODO
    # Step 1: compute sum of first k elements
    # Step 2: slide: add nums[i], remove nums[i-k], track max
    pass


def max_sum_fixed_window_solution(nums, k):
    window_sum = sum(nums[:k])
    best = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]   # slide right
        best = max(best, window_sum)
    return best


# ──────────────────────────────────────────────────────────────
# EXERCISE 2 (Easy): Average of All K-Length Subarrays  [FIXED]
# ──────────────────────────────────────────────────────────────
# Return a list of averages of each contiguous subarray of size k.
#
# Example:
#   nums = [1, 3, 2, 6, -1, 4, 1, 8, 2], k = 5
#   Answer: [2.2, 2.8, 2.4, 3.6, 2.8]

def subarray_averages(nums, k):
    # TODO
    pass


def subarray_averages_solution(nums, k):
    result = []
    window_sum = sum(nums[:k])
    result.append(window_sum / k)
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        result.append(window_sum / k)
    return result


# ──────────────────────────────────────────────────────────────
# EXERCISE 3 (Medium): Longest Subarray with Sum <= target  [VARIABLE]
# ──────────────────────────────────────────────────────────────
# All numbers are positive.
# Find the length of the longest subarray whose sum <= target.
#
# Example:
#   nums = [3, 1, 2, 7, 4, 2, 1, 1, 5], target = 8
#   Answer: 4  (subarray [2, 1, 1, 5] but wait that's wrong...
#               let's check: longest is [3,1,2]=6<=8 len=3
#               or [1,2] or [4,2,1,1]=8 len=4  ← answer=4)

def longest_subarray_sum_lte(nums, target):
    # TODO
    # Use variable window:
    #   - expand right by adding nums[right]
    #   - if window_sum > target, shrink from left
    #   - track max window length
    pass


def longest_subarray_sum_lte_solution(nums, target):
    left = 0
    window_sum = 0
    best = 0
    for right in range(len(nums)):
        window_sum += nums[right]               # expand right
        while window_sum > target:
            window_sum -= nums[left]            # shrink left
            left += 1
        best = max(best, right - left + 1)      # valid window!
    return best


# ──────────────────────────────────────────────────────────────
# EXERCISE 4 (Medium): Longest Substring Without Repeating Chars [VARIABLE]
# ──────────────────────────────────────────────────────────────
# Given a string, find the length of the longest substring
# that has NO duplicate characters.
#
# Example:
#   s = "abcabcbb"  →  3  ("abc")
#   s = "bbbbb"     →  1  ("b")
#   s = "pwwkew"    →  3  ("wke")

def longest_no_repeat(s):
    # TODO
    # Use a set to track characters in the window.
    # Variable window: shrink from left when we see a duplicate.
    pass


def longest_no_repeat_solution(s):
    seen = set()
    left = 0
    best = 0
    for right in range(len(s)):
        while s[right] in seen:       # duplicate! shrink left
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best


# ──────────────────────────────────────────────────────────────
# EXERCISE 5 (Medium): Minimum Window Substring  [VARIABLE]
# ──────────────────────────────────────────────────────────────
# Find the smallest substring of s that contains ALL characters
# of t (including duplicates).
# Return "" if impossible.
#
# Example:
#   s = "ADOBECODEBANC", t = "ABC"  →  "BANC"
#   s = "a", t = "a"                →  "a"
#   s = "a", t = "b"                →  ""

def min_window_substring(s, t):
    # TODO
    # Hint: use two dicts — need (what chars still needed)
    #       and window (chars currently in window)
    # "have" tracks how many chars satisfy their requirement
    # "formed" is complete when have == len(need)
    pass


def min_window_substring_solution(s, t):
    from collections import Counter
    need = Counter(t)               # {char: how many we need}
    window = {}
    have = 0                        # chars whose count is satisfied
    formed = len(need)              # total unique chars we need

    left = 0
    best = (float('inf'), 0, 0)    # (length, left, right)

    for right in range(len(s)):
        c = s[right]
        window[c] = window.get(c, 0) + 1
        # Check if this char's requirement is now met
        if c in need and window[c] == need[c]:
            have += 1

        # Try to shrink while window is valid
        while have == formed:
            # Update best answer
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right)
            # Remove leftmost char
            window[s[left]] -= 1
            if s[left] in need and window[s[left]] < need[s[left]]:
                have -= 1
            left += 1

    return "" if best[0] == float('inf') else s[best[1]:best[2] + 1]


# ──────────────────────────────────────────────────────────────
# EXERCISE 6 (Hard): Max Consecutive Ones III  [VARIABLE]
# ──────────────────────────────────────────────────────────────
# Given a binary array and integer k, return the max length
# of a subarray with at most k zeros (you can "flip" k zeros to 1).
#
# Example:
#   nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2  →  6
#   (flip the two 0s in [1,1,1,1,0,0] region → [1,1,1,1,1,1])

def max_ones_with_k_flips(nums, k):
    # TODO
    # Variable window: count zeros in window.
    # If zeros > k, shrink from left.
    pass


def max_ones_with_k_flips_solution(nums, k):
    left = 0
    zeros = 0
    best = 0
    for right in range(len(nums)):
        if nums[right] == 0:
            zeros += 1
        while zeros > k:
            if nums[left] == 0:
                zeros -= 1
            left += 1
        best = max(best, right - left + 1)
    return best


# ──────────────────────────────────────────────────────────────
# TESTS
# ──────────────────────────────────────────────────────────────
def test_all():
    print("=" * 50)
    print("SLIDING WINDOW TESTS")
    print("=" * 50)

    # Exercise 1
    assert max_sum_fixed_window_solution([2, 1, 5, 1, 3, 2], 3) == 9
    assert max_sum_fixed_window_solution([2, 3, 4, 1, 5], 2) == 7
    print("Exercise 1 (Max Sum Fixed Window)    PASS")

    # Exercise 2
    result = subarray_averages_solution([1, 3, 2, 6, -1, 4, 1, 8, 2], 5)
    expected = [2.2, 2.8, 2.4, 3.6, 2.8]
    assert all(abs(a - b) < 1e-9 for a, b in zip(result, expected))
    print("Exercise 2 (Subarray Averages)       PASS")

    # Exercise 3
    assert longest_subarray_sum_lte_solution([3, 1, 2, 7, 4, 2, 1, 1, 5], 8) == 4
    assert longest_subarray_sum_lte_solution([1, 2, 3], 6) == 3
    print("Exercise 3 (Longest Sum <= Target)   PASS")

    # Exercise 4
    assert longest_no_repeat_solution("abcabcbb") == 3
    assert longest_no_repeat_solution("bbbbb") == 1
    assert longest_no_repeat_solution("pwwkew") == 3
    print("Exercise 4 (Longest No Repeat)       PASS")

    # Exercise 5
    assert min_window_substring_solution("ADOBECODEBANC", "ABC") == "BANC"
    assert min_window_substring_solution("a", "a") == "a"
    assert min_window_substring_solution("a", "b") == ""
    print("Exercise 5 (Min Window Substring)    PASS")

    # Exercise 6
    assert max_ones_with_k_flips_solution([1,1,1,0,0,0,1,1,1,1,0], 2) == 6
    assert max_ones_with_k_flips_solution([0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1], 3) == 10
    print("Exercise 6 (Max Ones with K Flips)   PASS")

    print()
    print("All solution tests passed!")
    print()
    print("NOW TRY: Fill in the TODO functions above and test YOUR answers.")


if __name__ == "__main__":
    test_all()
