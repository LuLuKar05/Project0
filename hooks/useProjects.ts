'use client';

import {useEffect, useState} from 'react';
export type Projects = {
    id:             string;
    slug:           string;
    title:          string;
    category:       string;
    date:           string;
    shortDesc:      string;
    fullDesc:       string;
    tags:           string[];
    githubURL:      string | null;
    deployedURL:    string | null;
    active:         boolean;
    order:          number;

    orbit: {
        radius: number;
        speed: number;
        inclination: number;
    };

    visual: {
        textureUrl: string;
        sz: number;
        rotationSpeed: number;
        glowIntensity: number;
    };
};
export default function useProjects() {
    const [projects, setProjects] = useState<Projects[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/v1/projects')
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