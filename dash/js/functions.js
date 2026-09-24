window.initTaskPage = function(){
    //grabbing the connections data for map1
    const token = dom.token();

    /*
     * Used to send to the server that a task was completed, mark it server-side 
     */
    window.taskCompleted = function(id){
        httpPostWithAuth(
            `/V1/website/ACTION/TASK_COMPLETE`,
            token,
            'id=' + id
        , function(data){
            console.log(data);
        });
    }

    /*
     * Used to edit a task, show a diaglog or something 
     */
    function showEditTask(){

    }

    /*
     * Used to filter by list
     */
    window.filterByList = function(list_id, button = null){
        //navigation highlighting
        if(button != null){
            document.querySelectorAll(".tasks-list-link").forEach(task => {
                task.classList.remove('active');
            });

            button.classList.add('active');
        }


        //QUERY THROUGH ALL TASK ITEMS
        document.querySelectorAll(".task-item").forEach(task => {
            if(list_id == 'all'){
                task.style.display = "";
            }
            else{
                task.style.display =task.dataset.list == list_id
                        ? ""
                        : "none";
            }
        });
    }
} 