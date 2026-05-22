'use client'
import react from "react";
import {useState} from "react";


export default function Input({type, label, placeholder,value, onChange} : {
                                type?: string,
                                label?: string,
                                placeholder?: string,
                                value?: string,
                                onChange?: (value: string) => void}) {
  //When this component is called directly will used the internalState.
  const [internalValue, setInternalValue] = useState(value ?? ''); //If the state is controlled by the Parent compoent this will be unuse but it use the memory storage. 
  
  //Checked both value and onChange eventHandler is passed, if it does it mean is controlled by the parent component. 
  const isControlled = value !== undefined && onChange !== undefined; 
  //Check is the value is passed down but not the onChange eventhandler.
  //it mean provide the read access but not the write access to child compoent.
  const isReadOnly = value !== undefined && onChange === undefined;

  const currentValue = isControlled || isReadOnly ? value : internalValue;

  //If the parent compoent set the ValueState but not provide the onChange, the input will be read-only. So we need to check if the onChange is provided before update the internal state.
  //Need Improvement here.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
    //will update the internal state.
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    //will update the parent state.
    onChange?.(e.target.value);
  };
  return (
    //Currently if the parent component only provide read-only access. can't make it even interactive. need to add the console message to warn the devloper.
    
    <>
    {label && <label className="block text-white mb-2">{label}</label>}
    <input
      type={type || "text"}
      placeholder={placeholder}
      value={currentValue}
      onChange={handleChange}
      className="w-full py-2 rounded-md bg-secondary ring-2 ring-white text-white focus:outline-none focus:ring-2 focus:ring-primary-header"
    />
    </>
  )
}
