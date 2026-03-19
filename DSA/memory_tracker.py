# ============================================================
# LINKED LIST — Memory Tracker (See What Happens in RAM)
# ============================================================
# id(obj) gives the actual memory address of any Python object.
# We use this to watch how nodes get created and linked.
# ============================================================


class Node:
    def __init__(self, value):
        self.data = value
        self.next = None    # points to next Node (or None)

    def __repr__(self):
        next_addr = hex(id(self.next)) if self.next else "None"
        return (f"Node(data={self.data}, "
                f"addr={hex(id(self))}, "
                f"next -> {next_addr})")


class LinkList:
    def __init__(self):
        self.head = None    # ← MUST have a head to track the chain

    # ── push to FRONT (prepend) ──────────────────────────────
    def push(self, value):
        new_node = Node(value)
        new_node.next = self.head   # new node points to old head
        self.head = new_node        # head now points to new node

        print(f"\n  push({value})")
        print(f"    Created  : {new_node}")
        print(f"    head now -> {hex(id(self.head))}  (= Node {self.head.data})")

    # ── print the full chain ─────────────────────────────────
    def show_memory(self):
        print("\n" + "=" * 55)
        print("MEMORY SNAPSHOT (head -> ... -> None)")
        print("=" * 55)
        current = self.head
        step = 1
        while current:
            next_addr = hex(id(current.next)) if current.next else "None"
            print(f"  [{step}] addr={hex(id(current))}"
                  f"  data={current.data}"
                  f"  next -> {next_addr}")
            current = current.next
            step += 1
        print(f"  [end] -> None")
        print("=" * 55)

    def __repr__(self):
        values = []
        current = self.head
        while current:
            values.append(str(current.data))
            current = current.next
        return " -> ".join(values) + " -> None"


# ── RUN IT ───────────────────────────────────────────────────

print("Creating empty LinkList")
print(f"  list object address : {hex(id(LinkList()))}")

l = LinkList()
print(f"  l.head = {l.head}")   # None

l.push(10)
l.push(20)
l.push(30)

l.show_memory()

print(f"\nList as values : {l}")
