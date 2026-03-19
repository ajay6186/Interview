"""
Exercise 17 — Factory fixtures with Faker
==========================================
Goal: Build a reusable factory module so tests stop using hardcoded data.

Install Faker first:
  pip install faker

Then complete the TODOs below.
"""
# TODO: import Faker
# from faker import Faker
# fake = Faker()


def make_user_payload(**overrides: object) -> dict:
    """
    Return a dict suitable for POST /api/v1/users/

    TODO: use fake.email(), fake.user_name(), etc.
          Apply **overrides so callers can pin specific fields.

    Example usage:
        payload = make_user_payload(email="fixed@example.com")
        await client.post("/api/v1/users/", json=payload)
    """
    # TODO: implement
    raise NotImplementedError


def make_item_payload(**overrides: object) -> dict:
    """
    Return a dict suitable for POST /api/v1/items/

    TODO: use fake.sentence(nb_words=4) for title, fake.paragraph() for description.
    """
    # TODO: implement
    raise NotImplementedError


# ── Demo / smoke test ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        p = make_user_payload()
        print("make_user_payload():", p)
        p2 = make_user_payload(email="custom@test.com")
        assert p2["email"] == "custom@test.com", "overrides not working"
        print("make_user_payload(email=...) override:", p2)

        i = make_item_payload()
        print("make_item_payload():", i)
        print("\nAll factory checks passed!")
    except NotImplementedError:
        print("TODO: implement the factory functions above")
