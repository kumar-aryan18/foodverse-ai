import ollama

reply = ollama.chat(
    model="llama3.2:3b",
    messages=[{"role": "user",
               "content": "Suggest a healthy 3-ingredient breakfast."}],
)
print(reply["message"]["content"])