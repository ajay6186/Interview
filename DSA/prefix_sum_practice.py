# ============================================================
# PREFIX SUM — Deep Practice (Beginner Friendly)
# ============================================================
# HOW IT WORKS:
#   Build an extra array where each cell holds the sum of
#   ALL elements up to that point.
#
#   array  = [3, 1, 4, 1, 5]
#   prefix = [0, 3, 4, 8, 9, 14]   <- length is n+1, starts with 0
#
#   Sum of elements from index i to j (inclusive):
#       prefix[j+1] - prefix[i]
#
#   Example: sum(1, 3) = prefix[4] - prefix[1] = 9 - 3 = 6
#            That's 1 + 4 + 1 = 6 ✓
# ============================================================


# ──────────────────────────────────────────────────────────────
# HELPER: How to build a prefix sum array
# ──────────────────────────────────────────────────────────────
def build_prefix(nums):
    """
    Build a prefix sum array.
    Result has length len(nums)+1, first element is always 0.
    """
    prefix = [0] * (len(nums) + 1)
    for i in range(len(nums)):
        prefix[i + 1] = prefix[i] + nums[i]
    return prefix


# ──────────────────────────────────────────────────────────────
# EXERCISE 1 (Easy): Range Sum Query
# ──────────────────────────────────────────────────────────────
# Given an array, answer multiple "sum from index i to j" queries.
# Each query must be answered in O(1) — so precompute prefix first.
#
# Example:
#   nums    = [2, 4, 3, 1, 6]
#   query(1, 3) → 4+3+1 = 8
#   query(0, 4) → 2+4+3+1+6 = 16
#   query(2, 2) → 3

class RangeSumQuery:
    def __init__(self, nums):
        # TODO: Build prefix sum array here and store it
        pass

    def query(self, i, j):
        # TODO: Return sum of nums[i..j] using prefix array
        # Formula: prefix[j+1] - prefix[i]
        pass


# SOLUTION (read only after trying):
class RangeSumQuery_Solution:
    def __init__(self, nums):
        self.prefix = build_prefix(nums)

    def query(self, i, j):
        return self.prefix[j + 1] - self.prefix[i]


# ──────────────────────────────────────────────────────────────
# EXERCISE 2 (Easy): Number of subarrays with even sum
# ──────────────────────────────────────────────────────────────
# Count subarrays where the sum is even.
# Hint: sum(i,j) = prefix[j+1] - prefix[i]
#       It's even when both are even OR both are odd.
#
# Example:
#   nums = [1, 2, 3, 4]  →  answer = 4
#   (subarrays: [2], [4], [1,2,3], [2,3,4])

def count_even_sum_subarrays(nums):
    # TODO
    # Step 1: build prefix sum
    # Step 2: for every pair (i, j) where i < j,
    #         check if prefix[j] - prefix[i] is even
    pass


def count_even_sum_subarrays_solution(nums):
    prefix = build_prefix(nums)
    count = 0
    n = len(prefix)
    for i in range(n):
        for j in range(i + 1, n):
            if (prefix[j] - prefix[i]) % 2 == 0:
                count += 1
    return count


# ──────────────────────────────────────────────────────────────
# EXERCISE 3 (Medium): Subarray Sum Equals K
# ──────────────────────────────────────────────────────────────
# Count the number of subarrays that sum to exactly k.
#
# Key insight:
#   We want prefix[j] - prefix[i] == k
#   Rearranged: prefix[i] == prefix[j] - k
#   So as we scan, use a dict to count how many times
#   each prefix value has appeared before.
#
# Example:
#   nums = [1, 2, 3],  k = 3
#   Subarrays: [3], [1,2] → answer = 2

def subarray_sum_equals_k(nums, k):
    # TODO
    # Use a dict: seen = {0: 1}  (prefix 0 appears once before we start)
    # For each prefix[i], add (prefix[i] - k) lookups to count
    pass


def subarray_sum_equals_k_solution(nums, k):
    seen = {0: 1}   # prefix_sum → how many times seen
    current = 0
    count = 0
    for num in nums:
        current += num
        # If (current - k) was seen before, those are valid subarrays
        count += seen.get(current - k, 0)
        seen[current] = seen.get(current, 0) + 1
    return count


# ──────────────────────────────────────────────────────────────
# EXERCISE 4 (Medium): Pivot Index
# ──────────────────────────────────────────────────────────────
# Find the index where the sum of elements to the LEFT equals
# the sum of elements to the RIGHT.
#
# Example:
#   nums = [1, 7, 3, 6, 5, 6]  →  index 3
#   Left  of 3: 1+7+3 = 11
#   Right of 3: 5+6   = 11  ✓

def pivot_index(nums):
    # TODO
    # Hint: total = sum(nums)
    #       As you scan left to right, track left_sum
    #       right_sum = total - left_sum - nums[i]
    pass


def pivot_index_solution(nums):
    total = sum(nums)
    left_sum = 0
    for i, num in enumerate(nums):
        right_sum = total - left_sum - num
        if left_sum == right_sum:
            return i
        left_sum += num
    return -1


# ──────────────────────────────────────────────────────────────
# EXERCISE 5 (Hard): Minimum Size Subarray with Sum >= target
# ──────────────────────────────────────────────────────────────
# Find the shortest subarray whose sum is >= target.
# Return 0 if none exists.
# Note: all numbers are positive.
#
# Example:
#   nums = [2,3,1,2,4,3], target = 7  →  2  (subarray [4,3])
#
# Hint: Use prefix sums + binary search (or use sliding window
#       from the next file — it's easier that way!)

def min_size_subarray(target, nums):
    # TODO (bonus challenge — try the binary search approach)
    pass


def min_size_subarray_solution(target, nums):
    import bisect
    prefix = build_prefix(nums)
    result = float('inf')
    for j in range(1, len(prefix)):
        # We want the LARGEST i such that prefix[j] - prefix[i] >= target
        # i.e., prefix[i] <= prefix[j] - target
        need = prefix[j] - target
        # bisect_right finds first index > need; subtract 1 for last <= need
        i = bisect.bisect_right(prefix, need) - 1
        if i >= 0:
            result = min(result, j - i)
    return 0 if result == float('inf') else result


# ──────────────────────────────────────────────────────────────
# TESTS — run this file to check your answers
# ──────────────────────────────────────────────────────────────
def test_all():
    print("=" * 50)
    print("PREFIX SUM TESTS")
    print("=" * 50)

    # Exercise 1
    rsq = RangeSumQuery_Solution([2, 4, 3, 1, 6])
    assert rsq.query(1, 3) == 8,  f"Ex1 fail: got {rsq.query(1,3)}"
    assert rsq.query(0, 4) == 16, f"Ex1 fail: got {rsq.query(0,4)}"
    assert rsq.query(2, 2) == 3,  f"Ex1 fail: got {rsq.query(2,2)}"
    print("Exercise 1 (Range Sum Query)         PASS")

    # Exercise 2
    assert count_even_sum_subarrays_solution([1, 2, 3, 4]) == 4
    assert count_even_sum_subarrays_solution([2, 2, 2]) == 6
    print("Exercise 2 (Even Sum Subarrays)      PASS")

    # Exercise 3
    assert subarray_sum_equals_k_solution([1, 2, 3], 3) == 2
    assert subarray_sum_equals_k_solution([1, 1, 1], 2) == 2
    assert subarray_sum_equals_k_solution([1], 0) == 0
    print("Exercise 3 (Subarray Sum == K)       PASS")

    # Exercise 4
    assert pivot_index_solution([1, 7, 3, 6, 5, 6]) == 3
    assert pivot_index_solution([1, 2, 3]) == -1
    assert pivot_index_solution([2, 1, -1]) == 0
    print("Exercise 4 (Pivot Index)             PASS")

    # Exercise 5
    assert min_size_subarray_solution(7, [2, 3, 1, 2, 4, 3]) == 2
    assert min_size_subarray_solution(4, [1, 4, 4]) == 1
    assert min_size_subarray_solution(11, [1, 1, 1, 1, 1]) == 0
    print("Exercise 5 (Min Size Subarray)       PASS")

    print()
    print("All solution tests passed!")
    print()
    print("NOW TRY: Fill in the TODO functions above and test YOUR answers.")


if __name__ == "__main__":
    test_all()
