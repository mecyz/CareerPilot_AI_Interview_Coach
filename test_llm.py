from src.llm import generate_question
history = []
jd = 'We are hiring a Python developer with experience in APIs and data pipelines.'
q = generate_question(jd, history)
print(q)
