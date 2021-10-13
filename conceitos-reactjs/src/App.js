import React, {useEffect, useState } from "react";

import api from './services/api';

import "./styles.css";

function App() {
  const [repositories, setRepositories] = useState([]);

  async function handleAddRepository() {
    const repository = {
      title: `Repository ${Date.now()}`,
      url: 'repository_url',
      techs: ['Node.js', 'React', 'React Native'], 
      likes: 0,
    }
    
    const response = await api.post('/repositories', repository);

    setRepositories([...repositories, response.data]);
  }

  async function handleRemoveRepository(id) {
    await api.delete(`/repositories/${id}`);

    setRepositories(repositories.filter(repository => repository.id !== id));
  }

  useEffect(() => {
    async function loadRepositories() {
      const response = await api.get('/repositories');
      setRepositories(response.data);
    };

    loadRepositories();
  }, []);

  return (
    <div>
      <ul data-testid="repository-list">
        {repositories.map(repository => (
          <li key={repository.id}>
            {repository.title}

            <button onClick={() => {handleRemoveRepository(repository.id)}}>
              Remover
            </button>
          </li>
        ))}
      </ul>

      <button onClick={handleAddRepository}>Adicionar</button>
    </div>
  );
}

export default App;
