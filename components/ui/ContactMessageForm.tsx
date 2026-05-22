'use client'
import React from 'react'
import {useState} from "react";
import Input from './Input';

type InitialContactFormData = {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}

export default function ContactMessageForm() {
  const [formData, setFormData] = useState<InitialContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const handleChange = (field: keyof InitialContactFormData) => (value: string) => {
    setFormData(prevState => ({
        ...prevState,
        [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch('/api/v1/contact-submission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        message: formData.message,
      }),
    });
  };
  return (
    <div>ContactMessageForm
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={handleChange('firstName')}
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={handleChange('lastName')}
        />
        <Input
          label="Email"
          value={formData.email}
          onChange={handleChange('email')}
        />
        <Input
          label="Message"
          value={formData.message}
          onChange={handleChange('message')}
        />
    </div>
  )
}
