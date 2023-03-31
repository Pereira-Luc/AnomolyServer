
//Explain: https://www.youtube.com/watch?v=OLXw0X6dlnM

export const sendPushNotification = async (token: string, title: string, body: string, data: any) => {
    console.log('Sending push notification');
    const message = {
        to: token,
        title: title,
        body: body,
        data: {data: data},
        priority: "high",
        contentAvailable: true
    };

    console.table(message)

    const request = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
        },
        body: JSON.stringify(message),
    })

    const response = await request.json();

    console.log(response.data);

    //Check if response is valid
    if (response.data.status !== 'ok') { console.log('Error sending push notification'); }

    const success = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
        },
        body: JSON.stringify({ids: [response.data.id]}),
    })

    let res = await success.json();

    //Check if response is valid
    console.table(res.data);

}

