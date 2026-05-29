#input: “aaabbccddaad”, #output:a3b2c2d2a2d
# input= "aaabbccddaad"
# result = ''
# count = 1
# for i in range(1, len(input)):
#     if input[i] == input[i-1]:
#         count = count + 1
#     else:
#         result = result + input[i-1] + str(count)
#         count = 1

# print(result)

# input = [(1, 3), (2, 2), (3, 1)]

# for i in range(0, len(input)):
#     for j in range(i, len(input)):
#         if input[i][0] < input[j][0]:
#             input[i],  input[j] = input[j], input[i]
           
# print(input)

#input:4, #output:1234321

# input = 4
# result = ''
# for i in range(1, input+1):
#     result = result + str(i)

# for j in range(1, input):
#     result = result + str(j)
    
# print(result)



# input= "aaabbccddaad"
# result = ''
# count = 1
# for i in range(1, len(input)):
#      get_count(start, end, input)
#     else:
#         result = result + input[i-1] + str(count)
#         count = 1

# print(result)

input_str = "aaabbcdddaa"
# expected_output = a3b2c1d3a2

# def get_repeater(word, start, input):
#     count = 0
#     for i in range(start, len(input)):
#         if input[i] == word:
#             count = count + 1
#         else:
#             break
#     return count

# def expected_output(input):
#     result = ''
#     for i in range(0, len(input)):
#         if (i == 0):
#            count = get_repeater(input[i], i, input)
#            result = result+ input[i] + str(count)
           
#         if i>0 and input[i] !=input[i-1]:
#            count = get_repeater(input[i], i, input)
#            result = result+ input[i] + str(count)
            
#     return result
# print(expected_output(input_str))

ARR = [1,2,3,1,2,3,4,1,4,4,4,4]

d = {}

for i in ARR:
    if d.get(i):
       d[i] = d.get(i)+1
    else:
       d[i] = 1

print(d)

m = max(d.items())
n = min(d.items())

print(m)
print(n)

