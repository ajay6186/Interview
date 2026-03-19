# Input = [100, 200, 500, 400, 700, 300, 50, 10]

# def get_sum(input):
#   max_v = 0
#   temp_max = 0
#   for i in range(0, len(input)):
#       for j in range(i, len(input)):
#         if 
#             temp_max = input[j] + input[i]
#             max_v = max(temp_max, max_v)
#   return max_v

# print(get_sum(Input))

############################################################

# words = ["flower", "flow", "flight"]
# min_length = min(len(word) for word in words)                                                            
# result = ""                                                                                           
# for i in range(min_length):
#     if all(word[i] == words[0][i] for word in words):
#         result = result + words[0][i]
#     else:
#         break
# print(result)  # "fl"

################################################################

# Input = [1, [2, [3, [4]], 5]]
# result  = []
# def test(input):
#   for i in input:
#     if isinstance(i, list):
#       test(i)
#     else:
#       result.append(i)

# print()

# print(test(test(Input)))

##########################################################

# Input = [100, 200, 500, 400, 700, 300, 50, 10]
# def get_sum(input, k):
#   for i in range(0, len(input)):
#       for j in range(i, len(input)):
#         if input[j] > input[i]:
#             input[j], input[i] = input[i], input[j]
#   return sum(input[:k])

# print(get_sum(Input, k=2))

####################################################

# input = [(1, 3), (2, 2), (3, 1)]
# # [(3, 1), (2, 2), (1, 3)]

# for i in range(0, len(input)):
#     print(input[i])
#     for j in range(i, len(input)):
#       if input[i][0] < input[j][0]:
#         input[i], input[j] = input[j], input[i]

# print(input)

input= "aaabbccddaad"

def get_count(ch, start_index, input):
  count = 0
  for i in range(start_index, len(input)):
    if input[i] == ch:
      count = count + 1
    else:
      break
  return count


def get_result(input):
  result = ''
  for i in range(0, len(input)):
          if i == 0:
              result = result + input[i] + str(get_count(input[i], i, input))
          if i > 1:
            if input[i] != input[i-1]:
              result = result + input[i] + str(get_count(input[i], i, input))
  return result  

print(get_result(input))

########################################################################

a = "abcababed"

def get_longest_substring(input):
  result = ''
  max_s = ''
  temp_s = ''
  # for i in range(0, len(input)):
  #   for j in range(i, len(input)-1):
  #     print(f'{input[j]} < {input[j+1]}')
  #     if input[j] < input[j+1]:
  #         temp_s = temp_s + input[j]
  #     else:
  #       temp_s = temp_s + input[j]
  #       break
    
  #   print('---> temp_s', temp_s)
      
  #   if len(max_s) < len(temp_s):
  #     max_s = temp_s
  #     temp_s = ''
  
    for i in range(0, len(input)-1):

        if input[i] < input[i+1]:
            temp_s = temp_s + input[j]
        else:
          continue
      
        print('---> temp_s', temp_s)
          
        if len(max_s) < len(temp_s):
          max_s = temp_s
          temp_s = ''
    
  return max_s
  
  
print(get_longest_substring(a))

###################################################################################


Using FastAPI or Django, build CRUD APIs for a Task Management system with 
fields: 
  
  
id, title, description, status, priority, created_at. 
Include validation, 

proper HTTP status codes,

and 

pagination.


model.py

 class TaskManagement(model.modules):
   id = model.Int();
   title= model.Char()
   description = model.Text("")
   status = model.Boolean()
   priority = model.Char()
   created_at = model.DateTime()

view.py

  class TaskManagementViewSet(view.ViewSet):
    pagination = page, offset
    
    def get(self, request):
      if request.date.get("id"):
        return JSONResponse(TaskManagement.object.filter(id=request.date.get("id")).first(), 200)
      return pagination(TaskManagement.object.all(), 200)
    
    def post(self, request):
      return JSONResponse(TaskManagement(request.data), 201)
      
    def delete(self, request):
      return JSONResponse(TaskManagement.object.delete(id=request.date.get("id")))
    
    def update(self, request):
      return JSONResponse(TaskManagement.object.update(id=request.date.get("id"), request.data))

