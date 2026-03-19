import React, { useState } from "react";

// ============================================================
// Exercise: useState Fundamentals
// ============================================================
// Master the useState hook by building interactive components
// that manage different kinds of state: numbers, booleans,
// strings, arrays, and objects. You'll also practice the
// functional updater pattern for safe state transitions.
//
// Instructions:
// 1. Build a Counter with increment, decrement, and reset.
// 2. Build a Toggle that shows/hides a secret message.
// 3. Build a controlled text input that mirrors its value.
// 4. Build a TodoList that lets users add items to an array.
// 5. Build a ProfileForm managing an object with name, email, age.
// 6. Use the functional updater form in a BatchCounter.
// ============================================================

// TODO 1: Counter component
// - Initialize count state to 0
// - Render the current count in an <h2>
// - "Increment" button adds 1
// - "Decrement" button subtracts 1
// - "Reset" button sets count back to 0
function Counter() {
  // TODO: declare count state
  const [state, setState] = useState(0)

  const increament = () => {
    setState(state+1)
  };

  const decreament = () => {
    setState(state-1)
  };

  const reset = () => {
    setState(0)
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Counter</h2>
        <h2>{state}</h2>
        {/* <button onClick={()=> setState(state+1)}>Increment</button>
        <button onClick={()=> setState(state-1)}>decrement</button>
        <button onClick={()=> setState(0)}>reset</button> */}
        <button onClick={increament}>Increment</button>
        <button onClick={decreament}>decrement</button>
        <button onClick={reset}>reset</button>
      {/* TODO: decrement button */}
      {/* TODO: reset button */}
    </div>
  );
}

// TODO 2: Toggle component
// - Initialize isVisible state to false
// - Render a button that toggles isVisible
// - Conditionally render a <p> with "This is the secret message!" when isVisible is true
// - Button text should read "Show" when hidden, "Hide" when visible
function Toggle() {
  // TODO: declare isVisible state
  const [isVisible, setIsVisible] = useState(false)
  console.log(isVisible)
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Toggle</h2>
      {/* TODO: toggle button */}
      <button onClick = {() => setIsVisible(true)}>toggle buttom</button>
      {isVisible && (
        <p style={{ color: "green", fontWeight: "bold" }}>
          This is the secret message!
        </p>
      )}
    </div>
  );
}

// TODO 3: TextInput component
// - Initialize text state to ""
// - Render a controlled <input> bound to text state
// - Render a <p> that shows "You typed: {text}"
// - Render a "Clear" button that resets text to ""
function TextInput() {
  // TODO: declare text state
  const [text, setText] = useState('')
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Controlled Text Input</h2>
      {/* TODO: controlled input element */}
      <input
      type='text'
      value = {text}
      onChange={(e) => setText(e.target.value)}
      placeholder='type something ......'>
      </input>
      {/* TODO: display the current text */}
      <p>Your Type: {text}</p>
      {/* TODO: clear button */}
      <button onClick = {() => setText('')}>Reset</button>
    </div>
  );
}

// TODO 4: TodoList component
// - Initialize items state as an empty string array: string[]
// - Initialize inputValue state as ""
// - Render an <input> for the new todo text
// - Render an "Add" button that appends inputValue to items (only if non-empty) and clears the input
// - Render the list of items as <li> elements inside a <ul>
// - Show a count: "Items: {items.length}"
function TodoList() {
  // TODO: declare items state (string[])
  const [items, setItems] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("");
  // TODO: declare inputValue state
  console.log(`--> items ${items}`)
  // TODO: handleAdd function — append inputValue to items, clear inputValue

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed === "") return;
    setItems((prev) => [...prev, trimmed]);
    setInputValue("");
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Todo List</h2>
      {/* TODO: input for new item */}
      <input  
      type = 'text'
      value = {inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="new item">
      </input>
      {/* TODO: add button */}
      <button onClick = {handleAdd}>Add</button>
      <p>Count: {items.length}</p>
      {/* TODO: item count */}
      {/* TODO: render list */}
      <ul>
        {
          items.map( (item, index) => (<li key={index}>{item}</li>))
        }
      </ul>
    </div>
  );
}

// TODO 5: ProfileForm component
// - Initialize profile state as an object: { name: "", email: "", age: 0 }
// - Render three controlled inputs for name, email, and age
// - When updating, spread the previous state to preserve other fields:
//     setProfile(prev => ({ ...prev, name: newValue }))
// - Render a summary showing all three values
// - Render a "Reset" button that clears back to defaults
interface Profile {
  name: string;
  email: string;
  age: number;
}

const defaultprofile = {name:"", email: "", age: 0}
function ProfileForm() {
  // TODO: declare profile state with Profile type
  const [profile, setProfile] = useState<Profile>(defaultprofile)

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Profile Form</h2>
      {/* TODO: name input with label */}
      <label>
          Name:{" "}
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </label>
      {/* TODO: email input with label */}
      <br></br>
      <label>
        Email: {""}
        <input 
        type='email'
        value={profile.email}
        onChange = {(e) =>
          setProfile((prev) => ({ ...prev, email: e.target.value}))
        }/>
      </label>
      <br></br>
      {/* TODO: age input (type="number") with label */}
      <label>
        Age: {" "}
        <input
        type = 'number'
        value = {profile.age}
        onChange = {(e) => 
          setProfile((prev) => ({ ...prev, age:Number(e.target.value)}))
        }
        />
      </label>
      {/* TODO: display profile summary */}
      <br></br>
      <br></br>
      <strong>Profile Summary:</strong>
      <p>Name: {profile.name}</p>
      <p>Email: {profile.email}</p>
      <p>Age: {profile.age}</p>
      {/* TODO: reset button */}
      <button onClick = {() => setProfile(defaultprofile)}>Reset</button>
    </div>
  );
}

// TODO 6: BatchCounter component
// - Initialize count state to 0
// - Render a button "Add 3 (broken)" that calls setCount(count + 1) three times
//   (this will only add 1 because all three calls see the same stale count)
// - Render a button "Add 3 (correct)" that calls setCount(prev => prev + 1) three times
//   (this correctly adds 3 because each call uses the latest pending state)
// - Render the count so the user can compare both buttons
function BatchCounter() {
  // TODO: declare count state

  const [count , setCount] = useState(0)

  // TODO: handleBrokenAdd — call setCount(count + 1) three times in a row
  const handleBrokenAdd = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }
  // TODO: handleCorrectAdd — call setCount(prev => prev + 1) three times in a row
  const handleCorrectAdd = () => {
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
  }
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Batch Counter (Functional Updater)</h2>
      {/* TODO: display count */}
      <h2>Count: {count}</h2> <br/> <br/>
      {/* TODO: broken add button */}
      <button onClick = {handleBrokenAdd}>Broken Add Button</button> <br/> <br/>
      {/* TODO: correct add button */}
      <button onClick = {handleCorrectAdd}>Correct Add Button</button> <br/> <br/>
      {/* TODO: reset button */}
      <button onClick = {() => setCount(0)}>Reset Button</button>
    </div>
  );
}

function CharacterCounter(){
  const [text, setText] = useState('')
  const hanldeText = (e) => {
    const data = e.target.value
    if (data.length<100){
        setText(data)
    }
  }

  return (
    <div>
      <input
      type="text"
      value={text}
      onChange={hanldeText}
      placeholder="test value ..."></input>
    </div>
  )
}

function PasswordToggle() {
  const [showpassword, setShowPassword] = useState(false)

  const togglePassword = () => {
    if (showpassword){
      setShowPassword(false)
    }else{
      setShowPassword(true)
    }
    
  }

  return (
    <div style={{padding:"20px"}}>
      <label>Password: </label>
      <input
      type={showpassword ? "text" : "password"}
      placeholder="Enter Password"
      ></input>
      <button onClick={togglePassword}>{showpassword ? "Hide" : "Show"}</button>
    </div>
  )
}

function LikeButton(){
  const [like, setLike] = useState(false)
  const [count, setCount] = useState(12)

  const handleLike = () => {
    if(like){
      setCount(count-1)
    }else{
      setCount(count+1)
    }
    setLike(!like);
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <button onClick={handleLike}>
        👍 {count} Likes
      </button>
    </div>
  )
}

function ColorPicker(){
  const [color, setColor] = useState("")
  const handlecolor = (e) => {
    setColor(e.target.value) 
  }

  return (
    <div style={{
        height: "200px",
        padding: "20px",
        backgroundColor: color,
      }}>
        <h3>Selected color: {color || "None"}</h3>
        <select  onChange={handlecolor}>
          <option value="">Select Color</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
        </select>
    </div>
  )

}

function TodoList1() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const addItem = () => {
    if (input.trim() === "") return;
    setItems([...items, input]);
    setInput("");
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    if (editIndex === index) setEditIndex(null);
  };

  const startEdit = (index) => {
    setEditIndex(index);
    setEditValue(items[index]);
  };

  const saveEdit = () => {
    if (editValue.trim() === "") return;
    setItems(items.map((item, i) => (i === editIndex ? editValue : item)));
    setEditIndex(null);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "300px" }}>
      <h3>Todo List</h3>
      <input
        type="text"
        value={input}
        placeholder="Enter todo"
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={addItem}>Add</button>

      <ul>
        {items.map((item, index) => (
          <li key={index} style={{ marginTop: "10px" }}>
            {editIndex === index ? (
              <>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <button style={{ marginLeft: "10px" }} onClick={saveEdit}>
                  Save
                </button>
                <button style={{ marginLeft: "10px" }} onClick={() => setEditIndex(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                {item}
                <button style={{ marginLeft: "10px" }} onClick={() => removeItem(index)}>
                  ❌
                </button>
                <button style={{ marginLeft: "10px" }} onClick={() => startEdit(index)}>
                  Edit
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ex01_StringList(){
  const fruits = ["Apple", "Banana", "Cherry"];
  return <ul>{fruits.map((fruit) => <li key={fruit}>{fruit}</li>)}</ul>
}

function Ex02_Numbers(){
  const nums = [1, 2, 3, 4, 5]
  return <div>{nums.map((num) => <p key={num}>{num}</p>)}</div>;
}

function Ex03_WithIndex() {
  return (
    <div>
      {["a", "b", "c"].map((letter, index) => <p key= {index}>{letter}</p>)}
    </div>
  )
}

function Ex04_ObjectProperty() {
  const users = [{name: "Ali"}, {name: "Sara"}];
  return (
    <div>
      {users.map((user) => <p key={user.name}>{user.name}</p>)}
    </div>
  )
}

function Ex05_MultipleFields() {
    const people = [
      {name:"Ajay", age:25},
      {name:"Yadav", age:35}
    ]

    return (
      <div>
        {people.map((p) => <p key={p.name}>{p.name} - {p.age}</p>)}
      </div>
    )
}

function Ex06_Buttons() {
  return (
    <div>
      {["Save", "Delete", "Edit"].map((lable) => (<button key={lable}>{lable}</button>))}
    </div>
  )
}

function Ex07_Images(){
  const urls = ["https://via.placeholder.com/50", "https://via.placeholder.com/60"];
  return (
    <div>
          {urls.map((url) => <img key={url} src={url} alt="placeholder" />)}
    </div>
  );
}

function Ex01_Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Counter : {count}</p>
      <button onClick={() => setCount(count+1)}>+</button>
      <button onClick={() => setCount(count-1)}>-</button>
    </div>
  )
}

function Ex02_TextInput() {
    const [text, setText] = useState('')
    return (
      <div>
        <p>Answer : {text}</p>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}></input>
      </div>
    )
}

function Ex03_ToggleBoolean(){
    const [on, setOn] = useState(false);
    return (
      <div><p>Light: {on ? "ON 💡" : "OFF"}</p>
      <button onClick={() => setOn(!on)}>Toggle</button>
      </div>
    )
}

function Ex04_NumberInput() {
  const [ num, setNum ] = useState(0);
  return (
    <div>
      <input type="number" value={num} onChange={(e) => setNum(Number(e.target.value))}></input>
      <p>Double Number : {num*2}</p>
    </div>
  )
}

function Ex05_Checkbox() {
  const [checked, setChecked] = useState(false);
  return (
    <div>
        <input type="checkbox" checked= {checked} onChange={(e) => setChecked(e.target.checked)}></input>
        <p>{checked ? "Checked Yes" : "Checked No"}</p>
    </div>
  )
}

function Ex06_ShowHide() {
  const [show, setShow] = useState(false)
  return(
    <div>
      <button onClick={() => setShow(!show)}>{show ? "Show" : "Hide"}</button>
      {show && <p>Hello! I am visible.</p>}
    </div>
  )
}

function  Ex07_BackgroundColor(){
  const [color, setColor] = useState("#ffffff")
  return (
      <div style={{ background: color, padding: 16 }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}/>
        <p>Color: {color}</p>
      </div>
  )
}

function Ex08_LikeButton() {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const toggle = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  }
  return (
    <div>
      <button onClick={toggle} style={{color: liked ? "red" : "grey"}}>❤️ {likes}</button>
    </div>
  )
}

function Ex09_ScoreTracker(){
  const [score, setScore] = useState(0);
  return (
    <div>
      <p>Score: {score}</p>
      <button onClick={() => setScore(score+10)}> +10 </button>
      <button onClick={() => setScore(0)}>Reset</button>
    </div>
  )
}

function Ex10_Fontsize() {
  const [size, setSize] = useState(16);
  return (
    <div>
      <p style={{ fontSize: size }}>Sample Text</p>
      <button onClick={() => setSize(size+2)}>A+</button>
      <button onClick={() => setSize(Math.max(10, size-2))}>A-</button>
    </div>
  )
}

function Ex11_PasswordToggle(){
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");

  return (
    <div>
      <input type={show ? "text" : "password"}
      value={pw} onChange={(e) => setPw(e.target.value)}/>
      <button onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
    </div>
  )
}

function Ex12_CharCounter() {
  const [text, setText] = useState("");
  const max = 100;
  return (
    <div>
      <textarea value={text} maxLength={max} 
      onChange={(e) => setText(e.target.value)}
      style={{display:"block"}}/>
      <small>{text.length}/{max}</small>
    </div>
  )
}

export function App() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: useState Fundamentals</h1>
      {/* TODO: render all six components below */}
      {/* <Counter/> */}
      {/* <TextInput/> */}
      {/* <TodoList/> */}
      {/* <ProfileForm/> */}
      {/* <BatchCounter/> */}
      {/* <CharacterCounter/> */}
      {/* <PasswordToggle/> */}
      {/* <LikeButton/> */}
      {/* <ColorPicker/> */}
      {/* <TodoList1/> */}
      {/* <Ex01_StringList/> */}
      {/* <Ex02_Numbers/> */}
      {/* <Ex03_WithIndex/> */}
      {/* <Ex04_ObjectProperty/> */}
      {/* <Ex05_MultipleFields/> */}
      {/* <Ex06_Buttons/> */}
      {/* <Ex07_Images/> */}


      {/* Extra Practise */}
      {/* <Ex01_Counter/> */}
      {/* <Ex02_TextInput/> */}
      {/* <Ex03_ToggleBoolean/> */}
      {/* <Ex04_NumberInput/> */}
      {/* <Ex05_Checkbox/> */}
      {/* <Ex06_ShowHide/> */}
      {/* <Ex07_BackgroundColor/> */}
      {/* <Ex08_LikeButton/> */}
      {/* <Ex09_ScoreTracker/> */}
      {/* <Ex10_Fontsize/> */}
      {/* <Ex11_PasswordToggle/> */}
      {/* <Ex12_CharCounter/> */}
    </div>
  );
}
