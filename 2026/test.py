# Input : arr[] = {100, 200, 500, 400 700,, 300, 50, 10}, k = 2

# Output : 1000

Input = [100, 200, 500, 400 700,, 300, 50, 10]

def get_sum(input):
  max_v = 0
  temp_max = 0
  for i in range(0, len(input):
	for j in range(i, len(input):
		temp_max = input[j] + input[i]
		max_v = max(temp_max, max_v)
  return max_v

print(get_sum(Input))
