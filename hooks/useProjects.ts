'use client';

import {useEffect, useState} from 'react';
import {Project} from '@/lib/types';

export default function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/v1/getProjects')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch projects');
                }
                return res.json();
            })
            .then(data => {
                setProjects(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return { projects, loading, error };
}