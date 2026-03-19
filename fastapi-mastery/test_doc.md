What was created
                                                                                                                                                                    
  tests/                                                                                                                                                            
  ├── conftest.py          # Shared fixtures (loaded automatically)
  ├── test_crud.py         # 31 tests for Phase 2 CRUD API
  ├── test_dependencies.py # 17 tests for Phase 4 dependencies
  └── test_jwt_auth.py     # 27 tests for Phase 5 JWT auth

  pytest.ini               # Test config + custom markers

  ---
  Production patterns you should master

  ┌──────────────────────────────┬──────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐    
  │           Pattern            │                       Where it's used                        │                        Why it matters                        │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Module reload for state      │ conftest.py crud_client                                      │ Global vars in solutions don't reset between tests — reload  │    
  │ isolation                    │                                                              │ the module to get a clean slate                              │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Composed fixtures            │ alice_headers → alice_token → auth_client                    │ Avoid duplicating login logic; fixtures chain automatically  │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ dependency_overrides         │ test_dependency_override_replaces_db,                        │ THE way to unit-test FastAPI endpoints — swap real DB/auth   │    
  │                              │ test_me_via_dependency_override                              │ with a fake                                                  │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Always clean up overrides    │ every override test                                          │ app.dependency_overrides = {} in finally: — leaked overrides │    
  │                              │                                                              │  break unrelated tests                                       │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ @pytest.mark.parametrize     │ bad credentials, invalid tokens, bad payloads                │ One test body, many scenarios — no copy-paste                │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Schema assertion             │ test_product_shape, test_token_shape                         │ Check field names, not just values — catches silent API      │    
  │                              │                                                              │ contract breaks                                              │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Round-trip test              │ test_created_product_is_retrievable                          │ Create then fetch — mini integration test that validates two │    
  │                              │                                                              │  endpoints together                                          │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Security boundary tests      │ tampered token, missing sub claim, expired token             │ Test what your auth rejects, not just what it accepts        │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Time travel for expiry       │ test_expired_token_is_rejected                               │ Call create_access_token with timedelta(minutes=-1) — no     │    
  │                              │                                                              │ sleep needed                                                 │    
  ├──────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤    
  │ Negative assertions          │ test_patch_does_not_overwrite_other_fields,                  │ Assert the thing that should NOT happen — catches accidental │    
  │                              │ test_me_does_not_expose_password                             │  data leaks                                                  │    
  └──────────────────────────────┴──────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘   