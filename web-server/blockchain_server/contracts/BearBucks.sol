// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BearBucks is ERC20, Ownable {
    constructor() ERC20("BearBucks", "BRB") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    struct UserAssets {
        string studentId;
        bool ticketAccess;
        bool doorAccess;
        uint256 attendance;
    }

    mapping(address => UserAssets) public userAssets;

    function setUserAssets(
        address user,
        string memory studentId,
        bool ticketAccess,
        bool doorAccess,
        uint256 attendance
    ) public onlyOwner {
        require(attendance <= 999, "Attendance out of range");
        userAssets[user] = UserAssets(studentId, ticketAccess, doorAccess, attendance);
    }
    function incrementAttendance(address user) public onlyOwner {
        require(userAssets[user].attendance < 999, "Maximum attendance reached");
        userAssets[user].attendance += 1;
    }
    function getUserAssets(address user)
        public
        view
        returns (string memory, bool, bool, uint256)
    {
        UserAssets memory assets = userAssets[user];
        return (assets.studentId, assets.ticketAccess, assets.doorAccess, assets.attendance);
    }

    // New structure and mapping for user credentials
    struct UserCredentials {
        string email;
        string encryptedPassword;
    }

    mapping(address => UserCredentials) public userCredentials;

    // Store user credentials on-chain (only callable by owner)
    function setUserCredentials(
        address user,
        string memory email,
        string memory encryptedPassword
    ) public onlyOwner {
        userCredentials[user] = UserCredentials(email, encryptedPassword);
    }
}
