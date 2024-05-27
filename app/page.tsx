"use client";

import {redirect} from "next/navigation";
import {DropdownMenuItem} from "@radix-ui/react-dropdown-menu"

import {Button} from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {useEffect, useState} from "react";
import {SessionProvider, useSession} from "next-auth/react";
import {date} from "zod";
import {Toaster} from "@/components/ui/toaster";
import {date_to_str} from "../lib/date";
import { signOut } from "next-auth/react"
import {Settings} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";


export default function Home() {
    return (
        <SessionProvider>
            <HomePage/>
            <Toaster />
        </SessionProvider>
    )
}


function HomePage() {
    const {data: session, status} = useSession();
    if (status === "loading") return <div>Loading...</div>
    if (status === "unauthenticated") redirect("/api/auth/signin")

    return (
        <main className="flex min-h-screen p-16 bg-gray-50">
            {/*<div className="flex-[2] bg-gray-200 text-white">*/}
            {/*    <Sidebar/>*/}
            {/*</div>*/}
            <div className="flex-[10] bg-gray-50 p-10">
                <h1 className="text-center mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
                    Home
                </h1>
                <MainContents />
            </div>
        </main>
    );
}

const Sidebar = () => {
    return (
        <div className="text-center">
            {/*<div className="m-4">*/}
            {/*    <div className="text-black">Hello</div>*/}
            {/*</div>*/}
        </div>
    );
};


const MainContents = () => {
    const [open_models, setOpenModels] = useState(false);
    return (
        <>
            <div className="flex flex-col items-center bg-white p-4 shadow-md rounded-md">
                <div className="container">
                    <Tabs defaultValue="stats">
                        <TabsList>
                            <TabsTrigger value="stats">Stats</TabsTrigger>
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="setting">Setting</TabsTrigger>
                        </TabsList>
                        <TabsContent value="stats">
                            <div className="m-8">
                                <Stats />
                            </div>
                        </TabsContent>
                        <TabsContent value="users">
                            <div className="p-4">
                                <UsersTable/>
                            </div>
                        </TabsContent>
                        <TabsContent value="setting">
                            <div className="py-8">
                                <Button variant="outline" className="m-2"
                                        onClick={() => setOpenModels(true)}>Models</Button>
                                <Button variant="outline" onClick={() => signOut()} className="m-2">Sign out</Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <Models open_models={open_models} setOpenModels={setOpenModels}/>
        </>
    )
}

// Stats
interface StatsData {
    timestamp: string;
    [key: string]: string | number;
}

interface OperationData {
    timestamp: string;
    operationId: string;
}

const Stats = () => {
    const [logs, setLogs] = useState<StatsData[]>([]);
    const [operations, setOperations] = useState<string[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const response = await fetch("/api/stats");
            const data: OperationData[] = await response.json();
            const processedData = aggregateData(data);
            setLogs(processedData);
            const uniqueOperations = Array.from(new Set(data.map(item => item.operationId)));
            setOperations(uniqueOperations);
        };
        fetchStats();
    }, []);

    const operationColors: { [key: string]: string } = {
        generate: "#8884d8",
        embedding: "#82ca9d",
    };

    const aggregateData = (data: OperationData[]): StatsData[] => {
        const hourlyTotals: { [key: string]: { [key: string]: number } } = {};
        data.forEach(item => {
            const date = new Date(item.timestamp);
            date.setMinutes(0, 0, 0); // 時間を丸める
            const hourKey = date.toISOString();

            if (!hourlyTotals[hourKey]) {
                hourlyTotals[hourKey] = { generate: 0, embedding: 0 };
            }
            hourlyTotals[hourKey][item.operationId] = (hourlyTotals[hourKey][item.operationId] || 0) + 1;
        });

        return Object.keys(hourlyTotals).map(hour => ({
            timestamp: hour,
            ...hourlyTotals[hour]
        })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    };

    const dateToStr = (date: string): string => new Date(date).toLocaleString();

    const CustomTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    {payload.map((p, index) => (
                        <p key={index} className="intro">{`${p.name}: Count: ${p.value}`}</p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div className="my-4">
                <div className="text-2xl font-bold">Stats</div>
            </div>

            <AreaChart
                width={730}
                height={250}
                data={logs}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={dateToStr} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {operations.map(op => (
                    <Area
                        key={op}
                        type="monotone"
                        dataKey={op}
                        name={op}
                        stackId="1"
                        stroke={operationColors[op]}
                        fill={operationColors[op]}
                    />
                ))}
            </AreaChart>
        </div>
    );
};

// Users
interface User {
    id: string;
    displayId: string;
    roleId: string;
    lastAccessedAt?: string;
    createdAt: string;
}

const UsersTable = () => {
    const {data: session} = useSession();

    const [users, setUsers] = useState<User[]>()
    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch("/api/users");
            const data = await response.json();
            setUsers(data);
        }
        fetchUsers();
    }, []);
    return (
        <>
            <div className="my-4">
                <AddUserDialog setUsers={setUsers}/>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Role</TableHead>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="w-[100px]">Created At</TableHead>
                        <TableHead className="w-[100px]">Last Accessed At</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        users && users.map((user: any) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.roleId}</TableCell>
                                <TableCell>{user.displayId}</TableCell>
                                <TableCell>{date_to_str(user.createdAt)}</TableCell>
                                <TableCell>{date_to_str(user.lastAccessedAt)}</TableCell>
                                <TableCell>
                                    {
                                        // @ts-ignore
                                        session?.user.role === "admin" || user.displayId == session?.user?.displayId ?
                                            // @ts-ignore
                                            <UserColumnMenu setUsers={setUsers} displayId={user.displayId}/>
                                            :
                                            null
                                    }
                                </TableCell>
                            </TableRow>
                        ))
                    }
                </TableBody>
            </Table>
        </>
    )
}


function UserColumnMenu({setUsers, displayId}: { setUsers: any, displayId: string }) {
    const [open_delete_user, setOpenDeleteUser] = useState(false);
    const [open_change_password, setOpenChangePassword] = useState(false);
    const { toast } = useToast()
    // ユーザーを削除する関数
    const handleDelete = async () => {
        const res = await fetch(`/api/users/${displayId}`, {
            method: "DELETE",
        });
        setOpenDeleteUser(false);
        if (res.ok) {
            toast({
                title: "User deleted",
                description: "The user has been deleted successfully.",
            })
            const data = await res.json();
            setUsers((prev: any) => prev.filter((user: any) => user.id !== data.id));
        } else {
            toast({
                title: "Failed to delete user",
                description: "Failed to delete the user.",
                variant: "destructive",
            })
        }
    };

    const handleChangePassword = async (e: any) => {
        e.preventDefault();
        const password = e.target.password.value;
        const res = await fetch(`/api/users/${displayId}`, {
            method: "PUT",
            body: JSON.stringify({password: password}),
            headers: {
                "Content-Type": "application/json",
            },
        });
        setOpenChangePassword(false);
        if (res.ok) {
            toast({
                title: "Password changed",
                description: "The password has been changed successfully.",
            })
        } else {
            toast({
                title: "Failed to change password",
                description: "Failed to change the password.",
                variant: "destructive",
            })
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Settings />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={() => setOpenDeleteUser(true)} className="m-2">
                        Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenChangePassword(true)} className="m-2">
                        Change password
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open_delete_user} onOpenChange={setOpenDeleteUser}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete user</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user?
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={handleDelete} className="m-8" variant="destructive">Delete</Button>
                </DialogContent>
            </Dialog>
            <Dialog open={open_change_password} onOpenChange={setOpenChangePassword}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change user password</DialogTitle>
                        <DialogDescription>
                            Change the password for this user.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                placeholder="********"
                                type="password"
                                className="col-span-3"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Change</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </>
    );
}

function AddUserDialog({setUsers}: any) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast()
    const submitHandler = async (e: any) => {
        e.preventDefault();
        const id = e.target.id.value;
        const password = e.target.password.value;
        const response = await fetch("/api/users", {
            method: "POST",
            body: JSON.stringify({id, password}),
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        if (response.ok) {
            setOpen(false);
            toast({
                title: "User added",
                description: "The user has been added successfully.",
            })
            console.log(data)
            setUsers((prev: any) => [...prev, data]);
        }
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="m-2">Add user</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add user</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submitHandler} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="id" className="text-right">
                            ID
                        </Label>
                        <Input
                            id="id"
                            placeholder="user123"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password
                        </Label>
                        <Input
                            id="password"
                            placeholder="********"
                            type="password"
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}



// Settings
interface LocalModel {
    name: string;
    modified_at: string;
    size: string
}

const Models = ({open_models, setOpenModels}: { open_models: boolean, setOpenModels: any }) => {
    const [localModels, setLocalModels] = useState<LocalModel[]>()
    const {toast } = useToast();
    useEffect(() => {
        const fetchModels = async () => {
            const response = await fetch("/api/models");
            if (!response.ok) return;
            const data = await response.json();
            if (data && data.models) setLocalModels(data.models);
        }
        fetchModels();
    }, []);
    const AddModel = async (e: any) => {
        e.preventDefault();
        const name = e.target.name.value;
        console.log(name)
        const response = await fetch("/api/models", {
            method: "POST",
            body: JSON.stringify({name}),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            toast({
                title: "Model added",
                description: "The model has been added successfully. It may take a some minutes to be available.",
            })
        } else {
            toast({
                title: "Failed to add model",
                description: "Failed to add the model.",
                variant: "destructive",
            })
        }
        setOpenModels(false);
    }
    return (
        <Dialog open={open_models} onOpenChange={setOpenModels}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Models</DialogTitle>
                    <DialogDescription className="p-6">
                        <div>
                            <div className="font-bold">
                                Add new model
                            </div>
                            <div className="p-2">
                                List of models can be checked <a href={"https://ollama.com/library"} target='_blank'
                                                                 className="text-blue-500">here</a>.
                            </div>
                            <form onSubmit={AddModel}>
                                <div className="flex w-full max-w-sm items-center space-x-2 p-2">
                                    <Input type="text" id="name" placeholder="llama3:70b"/>
                                    <Button type="submit">Add</Button>
                                </div>
                            </form>

                            <div className="font-bold pt-4 pb-2">
                                List of local models
                            </div>
                        </div>
                        <div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Modified at</TableHead>
                                        <TableHead>Size</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {
                                        localModels && localModels.map((model: any) => (
                                            <TableRow key={model.name}>
                                                <TableCell>{model.name}</TableCell>
                                                <TableCell>{date_to_str(model.modified_at)}</TableCell>
                                                <TableCell>{model.size}</TableCell>
                                            </TableRow>
                                        ))
                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

