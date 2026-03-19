# ============================================================
# LINKED LIST — Deep Practice (Beginner Friendly)
# ============================================================
#
# WHAT IS A LINKED LIST?
# ──────────────────────
# A chain of NODES where each node holds:
#   - data  : the value stored
#   - next  : pointer/reference to the next node (None if last)
#
#   HEAD → [10|•] → [20|•] → [30|None]
#
# VS ARRAY:
#   Array  → fixed size, O(1) index access, O(n) insert/delete
#   LL     → dynamic size, O(n) access, O(1) insert/delete at known node
#
# TYPES:
#   1. Singly Linked List  — each node has only "next"
#   2. Doubly Linked List  — each node has "next" AND "prev"
#   3. Circular            — last node's next points back to head
#
# KEY OPERATIONS & TIME COMPLEXITY:
#   append (add to end)        → O(n)  [O(1) if tail pointer kept]
#   prepend (add to front)     → O(1)
#   insert at position         → O(n)
#   delete by value            → O(n)
#   search                     → O(n)
#   access by index            → O(n)
#
# COMMON PATTERNS:
#   1. Two Pointers (slow/fast) — detect cycle, find middle
#   2. Dummy Head node          — simplifies edge cases
#   3. Reverse traversal        — reverse a list
#   4. Runner technique         — k steps ahead
# ============================================================


# ──────────────────────────────────────────────────────────────
# NODE & LINKED LIST IMPLEMENTATION
# ──────────────────────────────────────────────────────────────

class Node:
    def __init__(self, data):
        self.data = data
        self.next = None   # points to next Node (or None)

class LinkedList:
    def __init__(self):
        self.head = None   # empty list starts with no head

    # ── helpers ──────────────────────────────────────────────

    def append(self, data):
        """Add to END — O(n)"""
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:          # walk to last node
            current = current.next
        current.next = new_node

    def prepend(self, data):
        """Add to FRONT — O(1)"""
        new_node = Node(data)
        new_node.next = self.head    # new node points to old head
        self.head = new_node         # head is now the new node

    def to_list(self):
        """Convert LL to Python list (for easy testing)"""
        result = []
        current = self.head
        while current:
            result.append(current.data)
            current = current.next
        return result

    def __repr__(self):
        return " → ".join(str(x) for x in self.to_list()) + " → None"


# helper to build a linked list from a Python list
def build_ll(values):
    ll = LinkedList()
    for v in values:
        ll.append(v)
    return ll


# ──────────────────────────────────────────────────────────────
# EXERCISE 1 (Easy): Print / Traverse a Linked List
# ──────────────────────────────────────────────────────────────
# Given the head of a linked list, return all values as a list.
#
# Example:
#   head → 1 → 2 → 3 → None
#   Output: [1, 2, 3]

def traverse(head):
    # TODO
    # Start at head, walk with current = current.next, collect data
    pass


def traverse_solution(head):
    result = []
    current = head
    while current:
        result.append(current.data)
        current = current.next
    return result


# ──────────────────────────────────────────────────────────────
# EXERCISE 2 (Easy): Find Length of Linked List
# ──────────────────────────────────────────────────────────────
# Count how many nodes are in the linked list.
#
# Example:
#   1 → 2 → 3 → None   →   3

def ll_length(head):
    # TODO
    pass


def ll_length_solution(head):
    count = 0
    current = head
    while current:
        count += 1
        current = current.next
    return count


# ──────────────────────────────────────────────────────────────
# EXERCISE 3 (Easy): Search for a Value
# ──────────────────────────────────────────────────────────────
# Return True if value exists in the list, False otherwise.
#
# Example:
#   1 → 2 → 3 → None, target=2  →  True
#   1 → 2 → 3 → None, target=5  →  False

def search(head, target):
    # TODO
    pass


def search_solution(head, target):
    current = head
    while current:
        if current.data == target:
            return True
        current = current.next
    return False


# ──────────────────────────────────────────────────────────────
# EXERCISE 4 (Easy): Delete a Node by Value
# ──────────────────────────────────────────────────────────────
# Remove the FIRST node whose data matches the target.
# Return the new head.
#
# Example:
#   1 → 2 → 3 → None, target=2  →  1 → 3 → None
#   1 → 2 → 3 → None, target=1  →  2 → 3 → None  (delete head)
#
# KEY TRICK: use a "dummy" node before head to handle head deletion cleanly.

def delete_node(head, target):
    # TODO
    # dummy = Node(0); dummy.next = head
    # Walk with prev and current
    # When current.data == target: prev.next = current.next
    pass


def delete_node_solution(head, target):
    dummy = Node(0)
    dummy.next = head
    prev = dummy
    current = head
    while current:
        if current.data == target:
            prev.next = current.next   # skip over current
            break
        prev = current
        current = current.next
    return dummy.next                  # new head


# ──────────────────────────────────────────────────────────────
# EXERCISE 5 (Medium): Reverse a Linked List
# ──────────────────────────────────────────────────────────────
# Reverse the list IN PLACE. Return the new head.
#
# Example:
#   1 → 2 → 3 → None   →   3 → 2 → 1 → None
#
# TRICK: Three pointers — prev, current, next_node
#   Each step: save next, flip arrow, advance

def reverse_ll(head):
    # TODO
    # prev = None
    # current = head
    # while current:
    #     next_node = current.next   ← save
    #     current.next = prev        ← flip arrow
    #     prev = current             ← advance prev
    #     current = next_node        ← advance current
    # return prev  ← new head
    pass


def reverse_ll_solution(head):
    prev = None
    current = head
    while current:
        next_node = current.next   # save next before overwriting
        current.next = prev        # flip the arrow
        prev = current             # prev moves forward
        current = next_node        # current moves forward
    return prev                    # prev is now the new head


# ──────────────────────────────────────────────────────────────
# EXERCISE 6 (Medium): Find the Middle Node
# ──────────────────────────────────────────────────────────────
# Return the VALUE of the middle node.
# If even number of nodes, return the SECOND middle.
#
# Example:
#   1 → 2 → 3 → None          →  2
#   1 → 2 → 3 → 4 → None      →  3  (second middle)
#
# TRICK: Slow & Fast pointers
#   slow moves 1 step, fast moves 2 steps
#   When fast reaches end, slow is at the middle

def find_middle(head):
    # TODO
    # slow = head, fast = head
    # while fast and fast.next:
    #     slow = slow.next
    #     fast = fast.next.next
    # return slow.data
    pass


def find_middle_solution(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next        # 1 step
        fast = fast.next.next   # 2 steps
    return slow.data            # slow is at the middle


# ──────────────────────────────────────────────────────────────
# EXERCISE 7 (Medium): Detect a Cycle (Floyd's Algorithm)
# ──────────────────────────────────────────────────────────────
# Return True if there is a cycle (a node's .next points back
# to an earlier node), False otherwise.
#
# Example:
#   1 → 2 → 3 → 4 → 2 (cycle back!)  →  True
#   1 → 2 → 3 → None                  →  False
#
# TRICK: Floyd's Cycle Detection
#   slow (1 step) and fast (2 steps)
#   If they ever MEET → cycle exists
#   If fast reaches None → no cycle

def has_cycle(head):
    # TODO
    # slow = head, fast = head
    # while fast and fast.next:
    #     slow = slow.next
    #     fast = fast.next.next
    #     if slow == fast: return True   ← same NODE object
    # return False
    pass


def has_cycle_solution(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:       # same object in memory → cycle!
            return True
    return False


# ──────────────────────────────────────────────────────────────
# EXERCISE 8 (Medium): Merge Two Sorted Linked Lists
# ──────────────────────────────────────────────────────────────
# Given two sorted linked lists, merge them into one sorted list.
# Return the new head.
#
# Example:
#   1 → 3 → 5 → None
#   2 → 4 → 6 → None
#   Result: 1 → 2 → 3 → 4 → 5 → 6 → None
#
# TRICK: Use a dummy head to avoid edge cases.
#   Compare heads of both lists, pick smaller, advance that pointer.

def merge_sorted(head1, head2):
    # TODO
    # dummy = Node(0); current = dummy
    # while head1 and head2:
    #     pick smaller of head1.data / head2.data
    #     append it to current; advance that list's pointer
    # append whichever list still has nodes
    # return dummy.next
    pass


def merge_sorted_solution(head1, head2):
    dummy = Node(0)
    current = dummy
    while head1 and head2:
        if head1.data <= head2.data:
            current.next = head1
            head1 = head1.next
        else:
            current.next = head2
            head2 = head2.next
        current = current.next
    current.next = head1 if head1 else head2   # attach remainder
    return dummy.next


# ──────────────────────────────────────────────────────────────
# EXERCISE 9 (Hard): Remove Nth Node From End
# ──────────────────────────────────────────────────────────────
# Remove the Nth node from the END of the list (1-indexed).
# Return the new head.
#
# Example:
#   1 → 2 → 3 → 4 → 5 → None, n=2  →  1 → 2 → 3 → 5 → None
#
# TRICK: Two pointers, gap of n
#   Move fast pointer n steps ahead.
#   Then move both slow and fast together.
#   When fast reaches end, slow is just BEFORE the target node.

def remove_nth_from_end(head, n):
    # TODO
    # dummy = Node(0); dummy.next = head
    # fast = dummy, slow = dummy
    # Move fast n+1 steps ahead
    # Then move both until fast is None
    # slow.next = slow.next.next  ← remove
    # return dummy.next
    pass


def remove_nth_from_end_solution(head, n):
    dummy = Node(0)
    dummy.next = head
    fast = dummy
    slow = dummy
    for _ in range(n + 1):          # move fast n+1 steps ahead
        fast = fast.next
    while fast:                      # move both until fast hits end
        slow = slow.next
        fast = fast.next
    slow.next = slow.next.next       # skip the target node
    return dummy.next


# ──────────────────────────────────────────────────────────────
# TESTS
# ──────────────────────────────────────────────────────────────
def test_all():
    print("=" * 50)
    print("LINKED LIST TESTS")
    print("=" * 50)

    # Exercise 1: Traverse
    ll = build_ll([1, 2, 3])
    assert traverse_solution(ll.head) == [1, 2, 3]
    print("Exercise 1 (Traverse)                PASS")

    # Exercise 2: Length
    ll = build_ll([1, 2, 3, 4])
    assert ll_length_solution(ll.head) == 4
    assert ll_length_solution(None) == 0
    print("Exercise 2 (Length)                  PASS")

    # Exercise 3: Search
    ll = build_ll([1, 2, 3])
    assert search_solution(ll.head, 2) == True
    assert search_solution(ll.head, 5) == False
    print("Exercise 3 (Search)                  PASS")

    # Exercise 4: Delete
    ll = build_ll([1, 2, 3])
    new_head = delete_node_solution(ll.head, 2)
    assert traverse_solution(new_head) == [1, 3]
    ll2 = build_ll([1, 2, 3])
    new_head2 = delete_node_solution(ll2.head, 1)
    assert traverse_solution(new_head2) == [2, 3]
    print("Exercise 4 (Delete Node)             PASS")

    # Exercise 5: Reverse
    ll = build_ll([1, 2, 3, 4, 5])
    new_head = reverse_ll_solution(ll.head)
    assert traverse_solution(new_head) == [5, 4, 3, 2, 1]
    print("Exercise 5 (Reverse)                 PASS")

    # Exercise 6: Middle
    ll = build_ll([1, 2, 3])
    assert find_middle_solution(ll.head) == 2
    ll2 = build_ll([1, 2, 3, 4])
    assert find_middle_solution(ll2.head) == 3
    print("Exercise 6 (Find Middle)             PASS")

    # Exercise 7: Cycle detection
    ll = build_ll([1, 2, 3, 4])
    assert has_cycle_solution(ll.head) == False
    # Create a cycle: 4.next → 2 (index 1)
    nodes = [Node(i) for i in [1, 2, 3, 4]]
    nodes[0].next = nodes[1]
    nodes[1].next = nodes[2]
    nodes[2].next = nodes[3]
    nodes[3].next = nodes[1]   # cycle!
    assert has_cycle_solution(nodes[0]) == True
    print("Exercise 7 (Detect Cycle)            PASS")

    # Exercise 8: Merge sorted
    ll1 = build_ll([1, 3, 5])
    ll2 = build_ll([2, 4, 6])
    merged = merge_sorted_solution(ll1.head, ll2.head)
    assert traverse_solution(merged) == [1, 2, 3, 4, 5, 6]
    print("Exercise 8 (Merge Sorted)            PASS")

    # Exercise 9: Remove nth from end
    ll = build_ll([1, 2, 3, 4, 5])
    new_head = remove_nth_from_end_solution(ll.head, 2)
    assert traverse_solution(new_head) == [1, 2, 3, 5]
    print("Exercise 9 (Remove Nth From End)     PASS")

    print()
    print("All solution tests passed!")
    print()
    print("NOW TRY: Fill in the TODO functions above and test YOUR answers.")


if __name__ == "__main__":
    test_all()
