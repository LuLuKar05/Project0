'use client';
import React, { useState, useEffect } from "react";
import Input from "./Input";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
}

export default function Form({defaultFormData} : { defaultFormData?: FormData }) {
  //reading the local storage
  const savedFormData = typeof window !== 'undefined' ? localStorage.getItem('formData') : null;
  const initialFormData = savedFormData ? JSON.parse(savedFormData) : defaultFormData;
  
  const [formData, setFormData] = useState({
    firstName: initialFormData?.firstName ?? '',
    lastName: initialFormData?.lastName ?? '',
    email: initialFormData?.email ?? '',
  });

  //save the form to local storage.
  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData(prevState => ({
        ...prevState,
        [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    //Prevent the default form submission behavior, which would cause a page reload. This allows us to handle the form data in JavaScript without refreshing the page.
    //has to passed this data to other layer like the API layer to send the data to the server.
    e.preventDefault();
    //fetching the API to send the form data to the server.
    await fetch('/api/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    localStorage.removeItem('formData');
    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>Form
        <Input
          label="First Name"
          placeholder="Enter your first name"
          value={formData.firstName}
          onChange={handleChange('firstName')}//decare the field here.
      />
      <Input
        label="Last Name"
        placeholder="Enter your last name"
        value={formData.lastName}
        onChange={handleChange('lastName')}
      />
      <Input
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange('email')}
      />
    </div>
    </form>
  )
}
