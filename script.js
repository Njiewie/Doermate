const tasks = [
    { title: "Help with grocery shopping", price: "$20" },
    { title: "Assemble IKEA furniture", price: "$45" },
    { title: "Walk my dog", price: "$15" },
];

function displayTasks() {
    const taskList = document.getElementById('task-list');
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.innerHTML = `<h3>${task.title}</h3><p>Price: ${task.price}</p>`;
        taskList.appendChild(div);
    });
}

window.onload = displayTasks;
"" 
