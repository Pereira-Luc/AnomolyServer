/**
 * Send push notification to a specific user
 * @param token
 * @param title
 * @param body
 * @param data
 */

export const sendPushNotification = async (token: String, title: String, body: String, data: any = null) => {
    console.log('Sending push notification');
    const message = {
        to: token,
        title: title,
        body: body,
        data: {data: data},
        priority: "high",
        contentAvailable: true
    };

    try {
        const request = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            body: JSON.stringify(message),
        })

        const response = await request.json();

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

    } catch (error) {
        console.log(error);
    }
    //Check if response is valid
    //console.table(res.data);

}