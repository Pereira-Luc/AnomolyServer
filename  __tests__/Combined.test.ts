

/**
 * This file is used for unit testing
 * using jest
 **/

import { ObjectId } from "mongodb";
import { Auth } from "../graphql/functions/Auth";
import { changeProfilePicture, getProfilePicture } from "../mongodb/functions/profilePic";
import { deleteUser, getUserById, savePushNotificationToken, userExistsById } from "../mongodb/functions/users";
import { signUp } from "../graphql/functions/signUp";
import { acceptFriendRequest, createFriends, friendshipExists, getAllFriends, getFriendshipId } from "../graphql/functions/createFriends";
import { Status } from "../graphql/Enum/Status";
import { getChatID } from "../graphql/functions/chatsFunc";
import { closeDb } from "../mongodb/mongoConnection";


/** Login Test
 * has to return a token
 * has to return a user
    * user shound have profile picture
    * shouldn't have password
    * shouldnt have firnedRequestStatus
    * and no chatId
    * requires public key
    * username

 * has to return an expiration date
**/



describe('Combined Unit Tests', () => {
  let user_id: ObjectId;

  //create user
  it('Create user and Leak test', async () => {
    let result = await signUp(null, {username: 'testuser', password: 'testpassword', confirmPassword: 'testpassword', publicKey: 'testpublickey'}, null);

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('tokenExpiration');
    expect(result).toHaveProperty('user');

    const { user } = result;

    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('publicKey');

    expect(user).not.toHaveProperty('profilePic');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('friendRequestStatus');
    expect(user).not.toHaveProperty('chatId');

});


  it('Check If no data is leaked on first Login', async () => {
    const result = await Auth('testuser', 'testpassword');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('tokenExpiration');
    expect(result).toHaveProperty('user');

    const { user } = result;
    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('publicKey');

    expect(user).not.toHaveProperty('profilePic');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('friendRequestStatus');
    expect(user).not.toHaveProperty('chatId');

    user_id = user._id;
  });

  //add profile picture
  it('Change prifile pic', async () => {
    const result = await changeProfilePicture(user_id, 'testprofilepicture');
    expect(result).toBe(true);
  });

  //add nodtification token
  it('ADD NOTIFICATION TOKEN', async () => {
    const result = await savePushNotificationToken(user_id, 'testnotificationtoken');
    expect(result).toBe(true);
  });


  it('Check If Password an notifications exist', async () => {
    const completeUserData = await getUserById(user_id, true, true);

    //check if has password, notification token 
    expect(completeUserData).toHaveProperty('password');
    expect(completeUserData).toHaveProperty('pushNotificationToken');

    
  });

  it('Data Leak Test', async () => {
    const result = await Auth('testuser', 'testpassword');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('tokenExpiration');
    expect(result).toHaveProperty('user');

    const { user } = result;
    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('publicKey');

    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('friendRequestStatus');
    expect(user).not.toHaveProperty('chatId');

    //profile pic gets retrived seperatly
    let profilePic = await getProfilePicture(user_id);
    expect(profilePic).toEqual('testprofilepicture');
  });

  let friend_id: ObjectId;

  //create a new user to test friend ship
  it('Create user and Leak test', async () => {
    let result = await signUp(null, {username: 'testuser2', password: 'testpassword', confirmPassword: 'testpassword', publicKey: 'testpublickey'}, null);

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('tokenExpiration');
    expect(result).toHaveProperty('user');

    const { user } = result;
    
    expect(user).toHaveProperty('username', 'testuser2');
    expect(user).toHaveProperty('publicKey');

    expect(user).not.toHaveProperty('profilePic');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('friendRequestStatus');
    expect(user).not.toHaveProperty('chatId');

    friend_id = user._id;
  });

  //send firend request
  it('Send friend request', async () => {
      let result = await createFriends(user_id, friend_id);

      //if friend request doesnt throw an error its successfull
      expect(result).toEqual("Friend request created successfully.")
  });

  //check if friend request is sent and data is there
  it('Check if friend request is sent', async () => {
    const allPendingFriends = await getAllFriends(user_id, Status.Pending);
    expect(allPendingFriends).toHaveLength(1);
  });

  let pubSub: any;
  let friendShipId: ObjectId;

  //accept friend request
  it('Accept friend request', async () => {
    let result = await acceptFriendRequest(user_id, friend_id, pubSub);

    //if friend request doesnt throw an error its successfull
    expect(result).toEqual("Friend request accepted successfully.")

    //get chatId
    friendShipId = await getFriendshipId(user_id, friend_id);
  });

  //check if chat is created
  it('Check if chat is created', async () => {
    let chatRoom = await getChatID(friendShipId);
    expect(chatRoom).not.toBe(null);
  });

  //delete user
  it('Delete user', async () => {
    const result = await deleteUser(user_id);
    expect(result).toBe(true);
  });

  //check if user is deleted
  it('Check if all Users are deleted', async () => {
   
    let userExists = await userExistsById(user_id);
    expect(userExists).toBe(false);  
    
    const result = await deleteUser(friend_id);
    expect(result).toBe(true);
  });


  //Check if friendship is deleted
  it('Check if friendship is deleted', async () => {
    const fe = await friendshipExists(friendShipId);
    expect(fe).toBe(false);
  });


  //check if chat is deleted
  it('Check if chatRoom is deleted', async () => {
    //Check if chat is deleted
    let chatRoom = await getChatID(friendShipId);
    expect(chatRoom).toBe(null);
  });

  //close connection
  afterAll(async () => {
    closeDb();
  });

});