# =============================================================================
# test_crud.py — Production-level tests for Phase 2 CRUD API
# =============================================================================
#
# CONCEPTS COVERED:
#   1.  TestClient   — synchronous test client wrapping the ASGI app
#   2.  Fixtures     — shared setup via conftest.py
#   3.  Parametrize  — run one test with many inputs
#   4.  pytest.raises — asserting exceptions
#   5.  State isolation — each test gets a fresh db via module reload
#   6.  Naming convention — test_<behaviour>_<scenario>
#
# RUN:
#   pytest tests/test_crud.py -v
#   pytest tests/test_crud.py -v -k "delete"   # run only delete tests
#
# =============================================================================

import pytest


# =============================================================================
# 1. LIST PRODUCTS
# =============================================================================

class TestListProducts:
    """Group related tests in a class — purely for organisation."""

    def test_returns_200(self, crud_client):
        response = crud_client.get("/products")
        assert response.status_code == 200

    def test_returns_list(self, crud_client):
        response = crud_client.get("/products")
        assert isinstance(response.json(), list)

    def test_seed_data_present(self, crud_client):
        """The solution seeds 2 products (Laptop & Phone)."""
        products = crud_client.get("/products").json()
        assert len(products) == 2

    def test_product_shape(self, crud_client):
        """
        PATTERN — Schema assertion:
            Check the keys, not just the value. This catches silent regressions
            where a field is accidentally removed from the response.
        """
        product = crud_client.get("/products").json()[0]
        assert set(product.keys()) == {"id", "name", "description", "price", "in_stock"}


# =============================================================================
# 2. GET SINGLE PRODUCT
# =============================================================================

class TestGetProduct:

    def test_existing_product_returns_200(self, crud_client):
        response = crud_client.get("/products/1")
        assert response.status_code == 200

    def test_returns_correct_product(self, crud_client):
        product = crud_client.get("/products/1").json()
        assert product["id"] == 1
        assert product["name"] == "Laptop"

    def test_missing_product_returns_404(self, crud_client):
        response = crud_client.get("/products/9999")
        assert response.status_code == 404

    def test_404_has_detail_message(self, crud_client):
        """
        PATTERN — Error body assertion:
            FastAPI raises HTTPException with a `detail` field. Always assert
            that the error message is meaningful — callers rely on it.
        """
        body = crud_client.get("/products/9999").json()
        assert "detail" in body
        assert body["detail"] == "Product not found"

    @pytest.mark.parametrize("product_id", [1, 2])
    def test_all_seed_products_accessible(self, crud_client, product_id):
        """
        PATTERN — Parametrize:
            Instead of copy-pasting the same test twice, parametrize generates
            two separate test cases automatically.
        """
        response = crud_client.get(f"/products/{product_id}")
        assert response.status_code == 200


# =============================================================================
# 3. CREATE PRODUCT
# =============================================================================

class TestCreateProduct:

    def test_returns_201(self, crud_client):
        payload = {"name": "Keyboard", "price": 79.99}
        response = crud_client.post("/products", json=payload)
        assert response.status_code == 201

    def test_response_contains_id(self, crud_client):
        payload = {"name": "Keyboard", "price": 79.99}
        product = crud_client.post("/products", json=payload).json()
        assert "id" in product
        assert isinstance(product["id"], int)

    def test_created_product_is_retrievable(self, crud_client):
        """
        PATTERN — Round-trip test:
            Create something, then fetch it. Validates both POST and GET work
            correctly together — a mini integration test.
        """
        payload = {"name": "Monitor", "price": 299.0, "in_stock": False}
        created = crud_client.post("/products", json=payload).json()
        fetched = crud_client.get(f"/products/{created['id']}").json()
        assert fetched["name"] == "Monitor"
        assert fetched["in_stock"] is False

    def test_default_in_stock_is_true(self, crud_client):
        payload = {"name": "Mouse", "price": 29.99}
        product = crud_client.post("/products", json=payload).json()
        assert product["in_stock"] is True

    def test_missing_required_fields_returns_422(self, crud_client):
        """
        422 Unprocessable Entity = Pydantic validation failed.
        Always test your validation boundaries.
        """
        response = crud_client.post("/products", json={"name": "NoPrice"})
        assert response.status_code == 422

    @pytest.mark.parametrize("bad_payload", [
        {},                              # completely empty
        {"price": 10.0},                 # missing name
        {"name": "X"},                   # missing price
    ])
    def test_invalid_payloads_return_422(self, crud_client, bad_payload):
        response = crud_client.post("/products", json=bad_payload)
        assert response.status_code == 422

    def test_ids_are_auto_incremented(self, crud_client):
        """Each new product gets a unique, incrementing ID."""
        p1 = crud_client.post("/products", json={"name": "A", "price": 1.0}).json()
        p2 = crud_client.post("/products", json={"name": "B", "price": 2.0}).json()
        assert p2["id"] == p1["id"] + 1


# =============================================================================
# 4. FULL UPDATE (PUT)
# =============================================================================

class TestUpdateProduct:

    def test_update_existing_product(self, crud_client):
        payload = {"name": "Laptop Pro", "price": 1299.99, "in_stock": True}
        response = crud_client.put("/products/1", json=payload)
        assert response.status_code == 200
        assert response.json()["name"] == "Laptop Pro"
        assert response.json()["price"] == 1299.99

    def test_update_preserves_id(self, crud_client):
        payload = {"name": "Changed", "price": 1.0, "in_stock": True}
        product = crud_client.put("/products/1", json=payload).json()
        assert product["id"] == 1

    def test_update_missing_product_returns_404(self, crud_client):
        payload = {"name": "Ghost", "price": 0.01, "in_stock": False}
        response = crud_client.put("/products/9999", json=payload)
        assert response.status_code == 404

    def test_put_overwrites_all_fields(self, crud_client):
        """
        PUT is a full replacement. If description is omitted, it should be
        gone (or None) in the response — not carrying over the old value.
        """
        payload = {"name": "Laptop", "price": 999.99}  # no description
        updated = crud_client.put("/products/1", json=payload).json()
        assert updated.get("description") is None


# =============================================================================
# 5. PARTIAL UPDATE (PATCH)
# =============================================================================

class TestPartialUpdateProduct:

    def test_patch_single_field(self, crud_client):
        response = crud_client.patch("/products/1", json={"price": 888.0})
        assert response.status_code == 200
        assert response.json()["price"] == 888.0

    def test_patch_does_not_overwrite_other_fields(self, crud_client):
        """
        PATTERN — Negative assertion:
            Assert that untouched fields keep their original values.
        """
        original = crud_client.get("/products/1").json()
        crud_client.patch("/products/1", json={"price": 1.0})
        updated = crud_client.get("/products/1").json()
        assert updated["name"] == original["name"]
        assert updated["in_stock"] == original["in_stock"]

    def test_patch_missing_product_returns_404(self, crud_client):
        response = crud_client.patch("/products/9999", json={"price": 1.0})
        assert response.status_code == 404


# =============================================================================
# 6. DELETE PRODUCT
# =============================================================================

class TestDeleteProduct:

    def test_delete_existing_product(self, crud_client):
        response = crud_client.delete("/products/1")
        assert response.status_code == 200

    def test_delete_response_message(self, crud_client):
        body = crud_client.delete("/products/1").json()
        assert "message" in body

    def test_deleted_product_is_gone(self, crud_client):
        """
        PATTERN — Side-effect verification:
            After delete, a subsequent GET should return 404.
            This confirms the state actually changed.
        """
        crud_client.delete("/products/1")
        response = crud_client.get("/products/1")
        assert response.status_code == 404

    def test_delete_missing_product_returns_404(self, crud_client):
        response = crud_client.delete("/products/9999")
        assert response.status_code == 404

    def test_delete_reduces_list_count(self, crud_client):
        before = len(crud_client.get("/products").json())
        crud_client.delete("/products/1")
        after = len(crud_client.get("/products").json())
        assert after == before - 1
