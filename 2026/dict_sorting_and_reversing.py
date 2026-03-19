"""
=============================================================
 Dictionary Sorting & Reversing in Python
 Interview Q&A — 6-7 Years Experience Level
 Base Example: {"a": 1, "b": 2}
=============================================================
"""

# ============================================================
# Q1: How do you sort a dictionary by its keys?
# ============================================================

d = {"b": 2, "a": 1, "c": 3}

# Method 1: dict comprehension + sorted()
sorted_by_key = dict(sorted(d.items()))
print("Q1 - Sort by key:", sorted_by_key)
# Output: {'a': 1, 'b': 2, 'c': 3}

# Method 2: explicit key function
sorted_by_key2 = dict(sorted(d.items(), key=lambda x: x[0]))
print("Q1 - Sort by key (lambda):", sorted_by_key2)


# ============================================================
# Q2: How do you sort a dictionary by its values?
# ============================================================

d = {"a": 3, "b": 1, "c": 2}

sorted_by_val = dict(sorted(d.items(), key=lambda x: x[1]))
print("\nQ2 - Sort by value:", sorted_by_val)
# Output: {'b': 1, 'c': 2, 'a': 3}


# ============================================================
# Q3: How do you reverse a dictionary (reverse key order)?
# ============================================================

d = {"a": 1, "b": 2, "c": 3}

# Method 1: reversed() on dict items (Python 3.8+)
reversed_d = dict(reversed(list(d.items())))
print("\nQ3 - Reversed (reversed()):", reversed_d)
# Output: {'c': 3, 'b': 2, 'a': 1}

# Method 2: slicing via list
reversed_d2 = dict(list(d.items())[::-1])
print("Q3 - Reversed (slicing):", reversed_d2)


# ============================================================
# Q4: How do you sort in descending order (reverse sort)?
# ============================================================

d = {"a": 1, "b": 2, "c": 3}

# By key descending
desc_key = dict(sorted(d.items(), key=lambda x: x[0], reverse=True))
print("\nQ4 - Sort by key DESC:", desc_key)
# Output: {'c': 3, 'b': 2, 'a': 1}

# By value descending
desc_val = dict(sorted(d.items(), key=lambda x: x[1], reverse=True))
print("Q4 - Sort by value DESC:", desc_val)
# Output: {'c': 3, 'b': 2, 'a': 1}


# ============================================================
# Q5: How do you swap keys and values (reverse mapping)?
# ============================================================

d = {"a": 1, "b": 2}

# Simple swap (only works if values are unique & hashable)
swapped = {v: k for k, v in d.items()}
print("\nQ5 - Swapped:", swapped)
# Output: {1: 'a', 2: 'b'}

# Safe swap (handles duplicate values)
from collections import defaultdict

d2 = {"a": 1, "b": 2, "c": 1}  # duplicate value 1
swapped_safe = defaultdict(list)
for k, v in d2.items():
    swapped_safe[v].append(k)
print("Q5 - Safe swapped:", dict(swapped_safe))
# Output: {1: ['a', 'c'], 2: ['b']}


# ============================================================
# Q6: Are dictionaries ordered in Python?
# ============================================================
"""
Answer:
- Python 3.7+  -> dict maintains INSERTION ORDER (language guarantee)
- Python 3.6   -> insertion order was CPython implementation detail only
- Python < 3.6 -> use collections.OrderedDict for ordered behavior
"""


# ============================================================
# Q7: sorted() vs OrderedDict — when to use which?
# ============================================================

from collections import OrderedDict

d = {"b": 2, "a": 1}

# sorted() returns a new regular dict (Python 3.7+)
s = dict(sorted(d.items()))
print("\nQ7 - sorted dict:", s)

# OrderedDict — order-aware equality
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print("Q7 - OrderedDict eq (diff order):", od1 == od2)  # False

# Regular dict ignores order in comparison
print("Q7 - Regular dict eq (diff order):", {"a": 1, "b": 2} == {"b": 2, "a": 1})  # True


# ============================================================
# Q8: Sort a nested dict by inner value?
# ============================================================

d = {
    "x": {"score": 80},
    "y": {"score": 95},
    "z": {"score": 70},
}

sorted_nested = dict(sorted(d.items(), key=lambda x: x[1]["score"], reverse=True))
print("\nQ8 - Sorted nested by score DESC:", sorted_nested)
# Output: {'y': {'score': 95}, 'x': {'score': 80}, 'z': {'score': 70}}


# ============================================================
# Q9: What is the time complexity of sorting a dict?
# ============================================================
"""
Answer:
- sorted() uses Timsort -> O(n log n) where n = number of key-value pairs
- Creating new dict from sorted items -> O(n)
- Overall complexity -> O(n log n)
"""


# ============================================================
# Q10: Using operator.itemgetter (senior-level preference)
# ============================================================

from operator import itemgetter

d = {"a": 3, "b": 1, "c": 2}

# Faster than lambda — implemented in C
sorted_by_val_ig = dict(sorted(d.items(), key=itemgetter(1)))
print("\nQ10 - itemgetter by value:", sorted_by_val_ig)
# Output: {'b': 1, 'c': 2, 'a': 3}

sorted_by_key_ig = dict(sorted(d.items(), key=itemgetter(0)))
print("Q10 - itemgetter by key:", sorted_by_key_ig)
# Output: {'a': 3, 'b': 1, 'c': 2}

"""
Why prefer itemgetter over lambda?
- Faster: C-level callable, no Python function call overhead
- More readable for experienced developers
- Preferred in production code at senior level
"""


# ============================================================
# QUICK CHEAT SHEET
# ============================================================
"""
| Task                  | Code                                                    |
|-----------------------|---------------------------------------------------------|
| Sort by key (asc)     | dict(sorted(d.items()))                                 |
| Sort by key (desc)    | dict(sorted(d.items(), reverse=True))                   |
| Sort by value (asc)   | dict(sorted(d.items(), key=itemgetter(1)))              |
| Sort by value (desc)  | dict(sorted(d.items(), key=itemgetter(1), reverse=True))|
| Reverse order         | dict(reversed(list(d.items())))                         |
| Swap key <-> value    | {v: k for k, v in d.items()}                            |
"""
