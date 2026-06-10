import { useEffect, useState } from 'react';
import {
  databases,
  storage,
  ID,
  DATABASE_ID,
  COLLECTION_ID,
  BUCKET_ID,
} from './appwrite';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const getImageUrl = (imageId) => {
    if (!imageId) return null;

    return storage.getFileView(BUCKET_ID, imageId);
  };

  const getTodos = async () => {
    try {
      setLoading(true);

      const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID
      );

      setTodos(response.documents);
    } catch (error) {
      console.error('Błąd pobierania TODO:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (event) => {
    event.preventDefault();

    if (!newTodo.trim()) return;

    try {
      let imageId = '';

      if (image) {
        const uploadedImage = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            image
        );

        imageId = uploadedImage.$id;
      }

      const createdTodo = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            title: newTodo,
            imageId,
          }
      );

      setTodos((prevTodos) => [createdTodo, ...prevTodos]);
      setNewTodo('');
      setImage(null);

      event.target.reset();
    } catch (error) {
      console.error('Błąd dodawania TODO:', error);
    }
  };

  const deleteTodo = async (todo) => {
    try {
      await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID,
          todo.$id
      );

      if (todo.imageId) {
        await storage.deleteFile(
            BUCKET_ID,
            todo.imageId
        );
      }

      setTodos((prevTodos) =>
          prevTodos.filter((item) => item.$id !== todo.$id)
      );
    } catch (error) {
      console.error('Błąd usuwania TODO:', error);
    }
  };

  useEffect(() => {
    getTodos();
  }, []);

  return (
      <main className="app">
        <section className="todo-box">
          <h1>Lista TODO</h1>

          <form onSubmit={addTodo} className="todo-form">
            <input
                type="text"
                placeholder="Dodaj nowe zadanie..."
                value={newTodo}
                onChange={(event) => setNewTodo(event.target.value)}
            />

            <input
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files[0])}
            />

            <button type="submit">
              Dodaj
            </button>
          </form>

          {loading ? (
              <p>Ładowanie zadań...</p>
          ) : (
              <ul className="todo-list">
                {todos.length === 0 ? (
                    <p>Brak zadań.</p>
                ) : (
                    todos.map((todo) => (
                        <li key={todo.$id} className="todo-item">
                          <div className="todo-content">
                            {todo.imageId && (
                                <img
                                    src={getImageUrl(todo.imageId)}
                                    alt={todo.title}
                                    className="todo-image"
                                />
                            )}

                            <span>{todo.title}</span>
                          </div>

                          <button
                              type="button"
                              onClick={() => deleteTodo(todo)}
                          >
                            Usuń
                          </button>
                        </li>
                    ))
                )}
              </ul>
          )}
        </section>
      </main>
  );
}

export default App;