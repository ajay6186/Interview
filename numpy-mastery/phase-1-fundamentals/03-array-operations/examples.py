# ============================================================================
# Examples 1.3 — Array Operations  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. element-wise addition
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print("Ex01:", a + b)  # [5 7 9]

# 2. element-wise subtraction
print("Ex02:", b - a)  # [3 3 3]

# 3. element-wise multiplication
print("Ex03:", a * b)  # [4 10 18]

# 4. element-wise division
print("Ex04:", b / a)  # [4. 2.5 2.]

# 5. element-wise power
print("Ex05:", a ** 2)  # [1 4 9]

# 6. scalar addition (broadcasting)
print("Ex06:", a + 10)  # [11 12 13]

# 7. scalar multiplication
print("Ex07:", a * 3)  # [3 6 9]

# 8. comparison: greater than scalar
print("Ex08:", a > 1)  # [F T T]

# 9. comparison: equal to scalar
print("Ex09:", b == 5)  # [F T F]

# 10. comparison: less than or equal
print("Ex10:", a <= 2)  # [T T F]

# 11. negation
print("Ex11:", -a)  # [-1 -2 -3]

# 12. absolute value
c = np.array([-3, -1, 0, 2, 4])
print("Ex12:", np.abs(c))  # [3 1 0 2 4]

# 13. floor division
print("Ex13:", b // 2)  # [2 2 3]

# 14. modulo
print("Ex14:", b % 2)  # [0 1 0]

# 15. np.add ufunc
print("Ex15:", np.add(a, b))  # [5 7 9]

# --- INTERMEDIATE ---

# 16. np.subtract ufunc
print("Ex16:", np.subtract(b, a))

# 17. np.multiply ufunc
print("Ex17:", np.multiply(a, b))

# 18. np.divide ufunc
print("Ex18:", np.divide(b, a.astype(float)))

# 19. np.power ufunc
print("Ex19:", np.power(a, 3))

# 20. np.sqrt
print("Ex20:", np.sqrt(np.array([1., 4., 9., 16.])))

# 21. np.exp (e^x)
print("Ex21:", np.exp(np.array([0., 1., 2.])).round(4))

# 22. np.log (natural log)
print("Ex22:", np.log(np.array([1., np.e, np.e**2])).round(4))

# 23. np.log2
print("Ex23:", np.log2(np.array([1., 2., 4., 8.])))

# 24. np.log10
print("Ex24:", np.log10(np.array([1., 10., 100.])))

# 25. np.maximum element-wise
print("Ex25:", np.maximum(a, np.array([2, 1, 4])))  # [2 2 4]

# 26. np.minimum element-wise
print("Ex26:", np.minimum(a, np.array([2, 1, 4])))  # [1 1 3]

# 27. np.clip — limit values to [min, max]
d = np.array([-2, 0, 3, 7, 10])
print("Ex27:", np.clip(d, 0, 5))  # [0 0 3 5 5]

# 28. np.sign — sign of each element
print("Ex28:", np.sign(c))  # [-1 -1 0 1 1]

# 29. np.floor, np.ceil, np.round
f = np.array([1.2, 2.7, -1.2, -2.7])
print("Ex29 floor:", np.floor(f), "ceil:", np.ceil(f), "round:", np.round(f))

# 30. compound expression on array
x = np.arange(1, 6, dtype=float)
result = (x ** 2 + 2 * x + 1) / (x + 1)  # (x+1)^2 / (x+1) = x+1
print("Ex30:", result)

# --- ADVANCED ---

# 31. np.mod (same as %)
print("Ex31:", np.mod(np.arange(10), 3))

# 32. np.divmod — quotient and remainder at once
q, r = np.divmod(np.array([7, 14, 21]), 5)
print("Ex32 q:", q, "r:", r)

# 33. np.reciprocal — 1/x
print("Ex33:", np.reciprocal(np.array([1., 2., 4.])))

# 34. np.square — x^2
print("Ex34:", np.square(np.arange(5)))

# 35. np.cbrt — cube root
print("Ex35:", np.cbrt(np.array([0., 1., 8., 27.])))

# 36. np.hypot — sqrt(a^2 + b^2)
print("Ex36:", np.hypot(3., 4.))  # 5.0

# 37. trig functions
angles = np.array([0, np.pi/6, np.pi/4, np.pi/3, np.pi/2])
print("Ex37 sin:", np.sin(angles).round(4))

# 38. arcsin / inverse trig
print("Ex38:", np.arcsin(np.array([0., 0.5, 1.])).round(4))

# 39. np.deg2rad and np.rad2deg
print("Ex39:", np.deg2rad(np.array([0., 90., 180., 360.])))

# 40. logical operations on boolean arrays
mask_a = np.array([True, False, True, False])
mask_b = np.array([True, True, False, False])
print("Ex40 AND:", np.logical_and(mask_a, mask_b))
print("Ex40 OR:", np.logical_or(mask_a, mask_b))
print("Ex40 NOT:", np.logical_not(mask_a))

# 41. bitwise operations
uint_a = np.array([0b1010, 0b1100], dtype=np.uint8)
uint_b = np.array([0b0110, 0b1010], dtype=np.uint8)
print("Ex41 AND:", np.bitwise_and(uint_a, uint_b))
print("Ex41 OR:", np.bitwise_or(uint_a, uint_b))
print("Ex41 XOR:", np.bitwise_xor(uint_a, uint_b))

# 42. np.isclose for floating point comparison
print("Ex42:", np.isclose(0.1 + 0.2, 0.3))  # True

# --- EXPERT ---

# 43. np.fabs — absolute value that always returns float
print("Ex43:", np.fabs(np.array([-3, -1.5, 0, 2])))

# 44. np.modf — fractional and integral parts
frac, intg = np.modf(np.array([1.7, -2.3, 3.0]))
print("Ex44 frac:", frac, "int:", intg)

# 45. np.frexp — mantissa and exponent (base-2)
man, exp = np.frexp(np.array([1., 2., 4., 8.]))
print("Ex45 mantissa:", man, "exponent:", exp)

# 46. np.ldexp — reconstruct from mantissa and exponent
print("Ex46:", np.ldexp(man, exp))  # [1. 2. 4. 8.]

# 47. np.conj — complex conjugate
z = np.array([1+2j, 3-4j])
print("Ex47:", np.conj(z))

# 48. np.angle — angle of complex number
print("Ex48:", np.angle(z).round(4))

# 49. np.real and np.imag
print("Ex49 real:", np.real(z), "imag:", np.imag(z))

# 50. np.copysign — copy sign from y to x
print("Ex50:", np.copysign(np.array([1., 2., 3.]), np.array([-1., 1., -1.])))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
