import { ObjectId } from "mongodb";
import { UserResolvers } from "../graphql/resolvers/user";
import { closeDb } from "../mongodb/mongoConnection";
import { User } from "../interfaces/User";
import { deleteUser, savePushNotificationToken, userExistsById } from "../mongodb/functions/users";
import { changeProfilePicture } from "../mongodb/functions/profilePic";


describe('Combined Resoler test', () => {

        afterAll(async () => {
                closeDb();
        });

        let mainUserToken: String = '';
        let mainUser: User;

        let friendUserToken: String = '';
        let friendUser: User;

        it ('Create User', async () => {
                const mockResolve = jest.fn();

                const mockArgs = {
                        username: 'testuser3',
                        password: 'testpassword',
                        confirmPassword: 'testpassword',
                        publicKey: 'testpublickey',
                    };
                    const mockContext = {};

                const result = await UserResolvers.Mutation.signUp(
                        mockResolve,
                        mockArgs,
                        mockContext,
                    );

                expect(result).toHaveProperty('token');
                expect(result).toHaveProperty('tokenExpiration');
                expect(result).toHaveProperty('user');

                const { user } = result;

                expect(user).toHaveProperty('username', 'testuser3');
                expect(user).toHaveProperty('publicKey');

                expect(user).not.toHaveProperty('profilePic');
                expect(user).not.toHaveProperty('password');
                expect(user).not.toHaveProperty('friendRequestStatus');
                expect(user).not.toHaveProperty('chatId');

                mainUserToken = result.token;
                mainUser = user;

        });

        it('Change prifile pic', async () => {
            const result = await changeProfilePicture(mainUser._id, 'testprofilepicture');
            expect(result).toBe(true);
          });
        
          //add nodtification token
          it('ADD NOTIFICATION TOKEN', async () => {
            const result = await savePushNotificationToken(mainUser._id, 'testnotificationtoken');
            expect(result).toBe(true);
          });

        it ('Login User Leak Test', async () => {
                const mockResolve = jest.fn();

                const mockArgs = {
                        username: 'testuser3',
                        password: 'testpassword',
                    };
                    const mockContext = {};

                const result = await UserResolvers.Query.login(
                        mockResolve,
                        mockArgs,
                        mockContext,
                    );

                expect(result).toHaveProperty('token');
                expect(result).toHaveProperty('tokenExpiration');
                expect(result).toHaveProperty('user');

                const { user } = result;

                expect(user).toHaveProperty('username', 'testuser3');
                expect(user).toHaveProperty('publicKey');

                expect(user).not.toHaveProperty('profilePic');
                expect(user).not.toHaveProperty('notificationToken');
                expect(user).not.toHaveProperty('password');
                expect(user).not.toHaveProperty('friendRequestStatus');
                expect(user).not.toHaveProperty('chatId');

                
        }); 

        // Create Friend
        it ('Create Friend', async () => {
                const mockResolve = jest.fn();

                const mockArgs = {
                        username: 'testuser4',
                        password: 'testpassword',
                        confirmPassword: 'testpassword',
                        publicKey: 'testpublickey',
                    };
                    const mockContext = {};

                const result = await UserResolvers.Mutation.signUp(
                        mockResolve,
                        mockArgs,
                        mockContext,
                    );

                expect(result).toHaveProperty('token');
                expect(result).toHaveProperty('tokenExpiration');
                expect(result).toHaveProperty('user');

                const { user } = result;

                expect(user).toHaveProperty('username', 'testuser4');
                expect(user).toHaveProperty('publicKey');

                expect(user).not.toHaveProperty('profilePic');
                expect(user).not.toHaveProperty('password');
                expect(user).not.toHaveProperty('friendRequestStatus');
                expect(user).not.toHaveProperty('chatId');

                friendUserToken = result.token;
                friendUser = user;
        });

        

        // Send Friend Request

        it ('Send Friend Request', async () => {
                const mockResolve = jest.fn();

                const mockArgs = {
                        friendId: friendUser._id,
                    };

                    let Context =  { isLoggedIn: true, userInfo: mainUser };
                    
            

                const result = await UserResolvers.Mutation.createFriends(
                        mockResolve,
                        mockArgs,
                        Context,
                    );

                expect(result).toEqual("Friend request created successfully.")
            }
        );


        //try and get frineds Userinfomation
        it ('Get Friends User Info', async () => {  
                const mockResolve = jest.fn();

                const mockArgs = {
                        friendId: friendUser._id,
                    };

                let Context =  { isLoggedIn: true, userInfo: mainUser };


                try {
                const result = await UserResolvers.Query.getUserInformation(
                        mockResolve,
                        mockArgs,
                        Context,
                    );
                    expect(true).toBe(false)
                } catch (error) {
                        expect(error).toEqual(new Error("You are not friends with this user"))
                }            
        });
            
                

        // Accept Friend Request
        it ('Accept Friend Request', async () => {
                const mockResolve = jest.fn();

                const mockArgs = {
                        friendId: mainUser._id,
                    };

                    let Context =  { isLoggedIn: true, userInfo: friendUser };
                    
            

                const result = await UserResolvers.Mutation.acceptRequest(
                        mockResolve,
                        mockArgs,
                        Context,
                    );

                expect(result).toEqual("Friend request accepted successfully.")
            }
        );

         //try and get frineds Userinfomation
         it ('Get Friends User Info Actual Firends', async () => {  
            const mockResolve = jest.fn();

            const mockArgs = {
                    userId: friendUser._id,
                };

            let Context =  { isLoggedIn: true, userInfo: mainUser };


            try {
            const result = await UserResolvers.Query.getUserInformation(
                    mockResolve,
                    mockArgs,
                    Context,
                );
                
                expect(result).toHaveProperty('username', 'testuser4');
                expect(result).toHaveProperty('publicKey');

                expect(result).not.toHaveProperty('profilePic');
                expect(result).not.toHaveProperty('password');
                expect(result).toHaveProperty('friendRequestStatus');
                expect(result).toHaveProperty('chatId');
            } catch (error) {
                    expect(error).not.toEqual(new Error("You are not friends with this user"))
            }            
    });


        //delete user
        it('Delete user', async () => {
        const result = await deleteUser(mainUser._id);
        expect(result).toBe(true);
        });

        //check if user is deleted
        it('Check if all Users are deleted', async () => {

        let userExists = await userExistsById(mainUser._id);
        expect(userExists).toBe(false);  

        const result = await deleteUser(friendUser._id);
        expect(result).toBe(true);
        });
});

    
